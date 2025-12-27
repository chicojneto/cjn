import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IndexConfig {
  symbol: string;
  name: string;
  googleSymbol: string;
}

const INDICES: IndexConfig[] = [
  { symbol: 'DXY', name: 'Índice Dólar', googleSymbol: 'DX-Y.NYB' },
  { symbol: 'VIX', name: 'Índice de Volatilidade', googleSymbol: 'VIX:INDEXCBOE' },
  { symbol: 'NASDAQ', name: 'Nasdaq Composite', googleSymbol: '.IXIC:INDEXNASDAQ' },
  { symbol: 'S&P 500', name: 'S&P 500', googleSymbol: '.INX:INDEXSP' },
  { symbol: 'DOW', name: 'Dow Jones', googleSymbol: '.DJI:INDEXDJX' },
  { symbol: 'NIKKEI', name: 'Nikkei 225', googleSymbol: 'NI225:INDEXNIKKEI' },
  { symbol: 'HK50', name: 'Hang Seng', googleSymbol: 'HSI:INDEXHANGSENG' },
];

// Fallback: Use Yahoo Finance API (more reliable)
async function fetchQuoteFromYahoo(config: IndexConfig): Promise<any> {
  const yahooSymbols: Record<string, string> = {
    'DXY': 'DX-Y.NYB',
    'VIX': '^VIX',
    'NASDAQ': '^IXIC',
    'S&P 500': '^GSPC',
    'DOW': '^DJI',
    'NIKKEI': '^N225',
    'HK50': '^HSI',
  };
  
  const yahooSymbol = yahooSymbols[config.symbol];
  if (!yahooSymbol) return null;
  
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=5d`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      console.log(`Yahoo failed for ${config.symbol}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result) return null;
    
    const meta = result.meta;
    const price = meta.regularMarketPrice;
    const previousClose = meta.previousClose || meta.chartPreviousClose;
    const change = price - previousClose;
    const changePercent = (change / previousClose) * 100;
    
    return {
      symbol: config.symbol,
      name: config.name,
      price: price,
      priceFormatted: price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      change: change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2),
      changeValue: change,
      changePercent: changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`,
      changePercentValue: changePercent,
      previousClose: previousClose,
      isPositive: change > 0,
      isNegative: change < 0,
    };
  } catch (error) {
    console.error(`Yahoo error for ${config.symbol}:`, error);
    return null;
  }
}

async function saveQuoteToDatabase(supabase: any, quote: any): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { error } = await supabase
      .from('global_indices_quotes')
      .upsert({
        symbol: quote.symbol,
        name: quote.name,
        price: quote.price,
        change_value: quote.changeValue,
        change_percent: quote.changePercentValue,
        quote_date: today,
      }, {
        onConflict: 'symbol,quote_date'
      });
    
    if (error) {
      console.error(`Error saving quote for ${quote.symbol}:`, error);
    } else {
      console.log(`Saved quote for ${quote.symbol}`);
    }
  } catch (error) {
    console.error(`Error saving quote for ${quote.symbol}:`, error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching global indices quotes...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const quotes = [];
    
    for (const config of INDICES) {
      const quote = await fetchQuoteFromYahoo(config);
      
      if (quote) {
        quotes.push(quote);
        // Save to database
        await saveQuoteToDatabase(supabase, quote);
      } else {
        // Add placeholder if fetch fails
        quotes.push({
          symbol: config.symbol,
          name: config.name,
          price: 0,
          priceFormatted: '--',
          change: '--',
          changeValue: 0,
          changePercent: '--',
          changePercentValue: 0,
          previousClose: 0,
          isPositive: false,
          isNegative: false,
        });
      }
    }
    
    console.log(`Fetched ${quotes.length} quotes`);
    
    return new Response(
      JSON.stringify({ quotes }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

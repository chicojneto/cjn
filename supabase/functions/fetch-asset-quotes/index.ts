import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map asset symbols to Yahoo Finance symbols
const YAHOO_SYMBOLS: Record<string, string> = {
  'XAU/USD': 'GC=F',
  'EUR/USD': 'EURUSD=X',
  'GBP/USD': 'GBPUSD=X',
  'USD/JPY': 'JPY=X',
  'USD/CAD': 'CAD=X',
  'USD/CHF': 'CHF=X',
  'USD/BRL': 'BRL=X',
  'WIN1!': 'BVSP',     // Ibovespa mini future
  'WDO1!': 'BRL=X',    // Mini dollar future (use USD/BRL)
  'IBOV': 'BVSP',
  'ES=F': 'ES=F',      // S&P 500 futures
  'NQ=F': 'NQ=F',      // Nasdaq futures
  'YM=F': 'YM=F',      // Dow futures
};

interface AssetQuote {
  symbol: string;
  name: string;
  category: string;
  price: number;
  priceFormatted: string;
  changeValue: number;
  changePercent: string;
  changePercentValue: number;
  isPositive: boolean;
  isNegative: boolean;
  timestamp: string | null;
}

async function fetchQuoteFromYahoo(symbol: string, name: string, category: string): Promise<AssetQuote | null> {
  const yahooSymbol = YAHOO_SYMBOLS[symbol] || symbol;
  
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=5d`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      console.log(`Yahoo failed for ${symbol}: ${response.status}`);
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
    
    // Determine decimal places based on category
    let decimals = 2;
    if (category === 'Forex' || symbol.includes('/')) {
      decimals = 4;
    }
    
    return {
      symbol,
      name,
      category,
      price,
      priceFormatted: price.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
      changeValue: change,
      changePercent: changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`,
      changePercentValue: changePercent,
      isPositive: change > 0,
      isNegative: change < 0,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Yahoo error for ${symbol}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch assets from database
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select('*')
      .order('symbol');

    if (assetsError) {
      throw new Error(`Failed to fetch assets: ${assetsError.message}`);
    }

    console.log(`Fetching quotes for ${assets?.length || 0} assets...`);
    
    const quotes: AssetQuote[] = [];
    
    for (const asset of (assets || [])) {
      const quote = await fetchQuoteFromYahoo(asset.symbol, asset.name, asset.category);
      
      if (quote) {
        quotes.push(quote);
      } else {
        // Return placeholder if quote fetch fails
        quotes.push({
          symbol: asset.symbol,
          name: asset.name,
          category: asset.category,
          price: 0,
          priceFormatted: '--',
          changeValue: 0,
          changePercent: '--',
          changePercentValue: 0,
          isPositive: false,
          isNegative: false,
          timestamp: null,
        });
      }
    }
    
    console.log(`Fetched ${quotes.length} asset quotes`);
    
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

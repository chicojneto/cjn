import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CurrencyConfig {
  symbol: string;
  name: string;
  yahooSymbol: string;
  category: 'currency' | 'commodity';
}

const CURRENCIES: CurrencyConfig[] = [
  // Moedas
  { symbol: 'EUR/USD', name: 'Euro / Dólar', yahooSymbol: 'EURUSD=X', category: 'currency' },
  { symbol: 'USD/JPY', name: 'Dólar / Iene', yahooSymbol: 'JPY=X', category: 'currency' },
  { symbol: 'GBP/USD', name: 'Libra / Dólar', yahooSymbol: 'GBPUSD=X', category: 'currency' },
  { symbol: 'USD/CHF', name: 'Dólar / Franco Suíço', yahooSymbol: 'CHF=X', category: 'currency' },
  { symbol: 'USD/CAD', name: 'Dólar / Dólar Canadense', yahooSymbol: 'CAD=X', category: 'currency' },
  { symbol: 'EUR/GBP', name: 'Euro / Libra', yahooSymbol: 'EURGBP=X', category: 'currency' },
  { symbol: 'USD/BRL', name: 'Dólar / Real', yahooSymbol: 'BRL=X', category: 'currency' },
  // Commodities
  { symbol: 'XAU/USD', name: 'Ouro', yahooSymbol: 'GC=F', category: 'commodity' },
  { symbol: 'OIL', name: 'Petróleo WTI', yahooSymbol: 'CL=F', category: 'commodity' },
  { symbol: 'COFFEE', name: 'Café', yahooSymbol: 'KC=F', category: 'commodity' },
];

async function fetchQuoteFromYahoo(config: CurrencyConfig): Promise<any> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(config.yahooSymbol)}?interval=1d&range=5d`;
    
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
    
    // Determine decimal places based on asset type
    let decimals = 4;
    if (config.category === 'commodity') {
      decimals = 2;
    }
    
    return {
      symbol: config.symbol,
      name: config.name,
      category: config.category,
      price: price,
      priceFormatted: price.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
      change: change >= 0 ? `+${change.toFixed(decimals)}` : change.toFixed(decimals),
      changeValue: change,
      changePercent: changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`,
      changePercentValue: changePercent,
      previousClose: previousClose,
      isPositive: change > 0,
      isNegative: change < 0,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Yahoo error for ${config.symbol}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching currency rates...');
    
    const quotes = [];
    
    for (const config of CURRENCIES) {
      const quote = await fetchQuoteFromYahoo(config);
      
      if (quote) {
        quotes.push(quote);
      } else {
        quotes.push({
          symbol: config.symbol,
          name: config.name,
          category: config.category,
          price: 0,
          priceFormatted: '--',
          change: '--',
          changeValue: 0,
          changePercent: '--',
          changePercentValue: 0,
          previousClose: 0,
          isPositive: false,
          isNegative: false,
          timestamp: null,
        });
      }
    }
    
    console.log(`Fetched ${quotes.length} currency quotes`);
    
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

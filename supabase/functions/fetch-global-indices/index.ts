import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

async function fetchQuoteFromGoogle(config: IndexConfig): Promise<any> {
  try {
    // Try Google Finance page scraping approach
    const url = `https://www.google.com/finance/quote/${config.googleSymbol}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      console.log(`Failed to fetch ${config.symbol}: ${response.status}`);
      return null;
    }

    const html = await response.text();
    
    // Extract price using regex patterns from Google Finance HTML
    const priceMatch = html.match(/data-last-price="([^"]+)"/);
    const changeMatch = html.match(/data-last-normal-market-change="([^"]+)"/);
    const changePercentMatch = html.match(/data-last-normal-market-change-percent="([^"]+)"/);
    
    if (priceMatch) {
      const price = parseFloat(priceMatch[1]);
      const change = changeMatch ? parseFloat(changeMatch[1]) : 0;
      const changePercent = changePercentMatch ? parseFloat(changePercentMatch[1]) : 0;
      
      return {
        symbol: config.symbol,
        name: config.name,
        price: price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        change: change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2),
        changePercent: changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`,
        isPositive: change > 0,
        isNegative: change < 0,
      };
    }
    
    console.log(`Could not parse price for ${config.symbol}`);
    return null;
  } catch (error) {
    console.error(`Error fetching ${config.symbol}:`, error);
    return null;
  }
}

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
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1d`;
    
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
      price: price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      change: change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2),
      changePercent: changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`,
      isPositive: change > 0,
      isNegative: change < 0,
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
    console.log('Fetching global indices quotes...');
    
    const quotes = [];
    
    for (const config of INDICES) {
      // Try Yahoo first (more reliable), then Google as fallback
      let quote = await fetchQuoteFromYahoo(config);
      
      if (!quote) {
        quote = await fetchQuoteFromGoogle(config);
      }
      
      if (quote) {
        quotes.push(quote);
      } else {
        // Add placeholder if both fail
        quotes.push({
          symbol: config.symbol,
          name: config.name,
          price: '--',
          change: '--',
          changePercent: '--',
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

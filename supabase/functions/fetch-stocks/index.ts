import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StockConfig {
  symbol: string;
  yahooSymbol: string;
  name: string;
  market: 'B3' | 'DOW';
}

// Main B3 stocks
const B3_STOCKS: StockConfig[] = [
  { symbol: 'PETR4', yahooSymbol: 'PETR4.SA', name: 'Petrobras', market: 'B3' },
  { symbol: 'VALE3', yahooSymbol: 'VALE3.SA', name: 'Vale', market: 'B3' },
  { symbol: 'ITUB4', yahooSymbol: 'ITUB4.SA', name: 'Itaú Unibanco', market: 'B3' },
  { symbol: 'BBDC4', yahooSymbol: 'BBDC4.SA', name: 'Bradesco', market: 'B3' },
  { symbol: 'BBAS3', yahooSymbol: 'BBAS3.SA', name: 'Banco do Brasil', market: 'B3' },
  { symbol: 'ABEV3', yahooSymbol: 'ABEV3.SA', name: 'Ambev', market: 'B3' },
  { symbol: 'WEGE3', yahooSymbol: 'WEGE3.SA', name: 'WEG', market: 'B3' },
  { symbol: 'RENT3', yahooSymbol: 'RENT3.SA', name: 'Localiza', market: 'B3' },
  { symbol: 'B3SA3', yahooSymbol: 'B3SA3.SA', name: 'B3', market: 'B3' },
  { symbol: 'MGLU3', yahooSymbol: 'MGLU3.SA', name: 'Magazine Luiza', market: 'B3' },
];

// Main Dow Jones stocks
const DOW_STOCKS: StockConfig[] = [
  { symbol: 'AAPL', yahooSymbol: 'AAPL', name: 'Apple', market: 'DOW' },
  { symbol: 'MSFT', yahooSymbol: 'MSFT', name: 'Microsoft', market: 'DOW' },
  { symbol: 'AMZN', yahooSymbol: 'AMZN', name: 'Amazon', market: 'DOW' },
  { symbol: 'NVDA', yahooSymbol: 'NVDA', name: 'Nvidia', market: 'DOW' },
  { symbol: 'JPM', yahooSymbol: 'JPM', name: 'JPMorgan', market: 'DOW' },
  { symbol: 'V', yahooSymbol: 'V', name: 'Visa', market: 'DOW' },
  { symbol: 'UNH', yahooSymbol: 'UNH', name: 'UnitedHealth', market: 'DOW' },
  { symbol: 'HD', yahooSymbol: 'HD', name: 'Home Depot', market: 'DOW' },
  { symbol: 'DIS', yahooSymbol: 'DIS', name: 'Disney', market: 'DOW' },
  { symbol: 'KO', yahooSymbol: 'KO', name: 'Coca-Cola', market: 'DOW' },
];

const ALL_STOCKS = [...B3_STOCKS, ...DOW_STOCKS];

interface StockQuote {
  symbol: string;
  name: string;
  market: 'B3' | 'DOW';
  price: number;
  priceFormatted: string;
  changeValue: number;
  changePercent: string;
  changePercentValue: number;
  isPositive: boolean;
  isNegative: boolean;
}

async function fetchStockQuote(config: StockConfig): Promise<StockQuote | null> {
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
    
    // Format price based on market
    const currency = config.market === 'B3' ? 'BRL' : 'USD';
    const locale = config.market === 'B3' ? 'pt-BR' : 'en-US';
    
    return {
      symbol: config.symbol,
      name: config.name,
      market: config.market,
      price,
      priceFormatted: price.toLocaleString(locale, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }),
      changeValue: change,
      changePercent: changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`,
      changePercentValue: changePercent,
      isPositive: change > 0,
      isNegative: change < 0,
    };
  } catch (error) {
    console.error(`Error fetching ${config.symbol}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching stock quotes...');
    
    const b3Quotes: StockQuote[] = [];
    const dowQuotes: StockQuote[] = [];
    
    for (const config of ALL_STOCKS) {
      const quote = await fetchStockQuote(config);
      
      if (quote) {
        if (config.market === 'B3') {
          b3Quotes.push(quote);
        } else {
          dowQuotes.push(quote);
        }
      } else {
        // Placeholder
        const placeholder: StockQuote = {
          symbol: config.symbol,
          name: config.name,
          market: config.market,
          price: 0,
          priceFormatted: '--',
          changeValue: 0,
          changePercent: '--',
          changePercentValue: 0,
          isPositive: false,
          isNegative: false,
        };
        
        if (config.market === 'B3') {
          b3Quotes.push(placeholder);
        } else {
          dowQuotes.push(placeholder);
        }
      }
    }
    
    console.log(`Fetched ${b3Quotes.length} B3 stocks and ${dowQuotes.length} DOW stocks`);
    
    return new Response(
      JSON.stringify({ 
        b3Quotes, 
        dowQuotes 
      }),
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
  timestamp: string | null;
}

interface CorrelationAnalysis {
  dxy: MarketData | null;
  vix: MarketData | null;
  us10y: MarketData | null;
  us2y: MarketData | null;
  gold: MarketData | null;
  oil: MarketData | null;
  ironOre: MarketData | null;
  copper: MarketData | null;
  sp500Futures: MarketData | null;
  nasdaqFutures: MarketData | null;
  dowFutures: MarketData | null;
  eurUsd: MarketData | null;
  usdJpy: MarketData | null;
  usdBrl: MarketData | null;
  ibovFutures: MarketData | null;
  // Analysis signals
  winBias: 'bullish' | 'bearish' | 'neutral';
  wdoBias: 'bullish' | 'bearish' | 'neutral';
  goldBias: 'bullish' | 'bearish' | 'neutral';
  winSignals: string[];
  wdoSignals: string[];
  goldSignals: string[];
}

// Yahoo Finance symbols mapping
const SYMBOLS: Record<string, { yahoo: string; name: string }> = {
  dxy: { yahoo: 'DX-Y.NYB', name: 'DXY (Índice Dólar)' },
  vix: { yahoo: '^VIX', name: 'VIX (Volatilidade)' },
  us10y: { yahoo: '^TNX', name: 'Treasury 10Y' },
  us2y: { yahoo: '^IRX', name: 'Treasury 2Y' },
  gold: { yahoo: 'GC=F', name: 'Ouro (XAU/USD)' },
  oil: { yahoo: 'CL=F', name: 'Petróleo WTI' },
  brent: { yahoo: 'BZ=F', name: 'Petróleo Brent' },
  copper: { yahoo: 'HG=F', name: 'Cobre' },
  sp500Futures: { yahoo: 'ES=F', name: 'S&P 500 Futuros' },
  nasdaqFutures: { yahoo: 'NQ=F', name: 'Nasdaq Futuros' },
  dowFutures: { yahoo: 'YM=F', name: 'Dow Jones Futuros' },
  eurUsd: { yahoo: 'EURUSD=X', name: 'EUR/USD' },
  usdJpy: { yahoo: 'JPY=X', name: 'USD/JPY' },
  usdBrl: { yahoo: 'BRL=X', name: 'USD/BRL' },
  ibov: { yahoo: '^BVSP', name: 'Ibovespa' },
  dax: { yahoo: '^GDAXI', name: 'DAX' },
  nikkei: { yahoo: '^N225', name: 'Nikkei 225' },
  hangSeng: { yahoo: '^HSI', name: 'Hang Seng' },
};

async function fetchQuoteFromYahoo(key: string, config: { yahoo: string; name: string }): Promise<MarketData | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(config.yahoo)}?interval=1d&range=5d`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      console.log(`Yahoo failed for ${key}: ${response.status}`);
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
      symbol: config.yahoo,
      name: config.name,
      price,
      change,
      changePercent,
      isPositive: change > 0,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Yahoo error for ${key}:`, error);
    return null;
  }
}

function analyzeCorrelations(data: Record<string, MarketData | null>): CorrelationAnalysis {
  const winSignals: string[] = [];
  const wdoSignals: string[] = [];
  const goldSignals: string[] = [];
  
  let winBullishScore = 0;
  let winBearishScore = 0;
  let wdoBullishScore = 0;
  let wdoBearishScore = 0;
  let goldBullishScore = 0;
  let goldBearishScore = 0;
  
  // Analyze US Futures for WIN
  const spFutures = data.sp500Futures;
  const nqFutures = data.nasdaqFutures;
  const ymFutures = data.dowFutures;
  
  if (spFutures) {
    if (spFutures.isPositive) {
      winBullishScore += 2;
      winSignals.push(`Futuros S&P 500: +${spFutures.changePercent.toFixed(2)}% (positivo para WIN)`);
    } else {
      winBearishScore += 2;
      winSignals.push(`Futuros S&P 500: ${spFutures.changePercent.toFixed(2)}% (pressão no WIN)`);
    }
  }
  
  // Analyze DXY for WDO
  const dxy = data.dxy;
  if (dxy) {
    if (dxy.isPositive) {
      wdoBullishScore += 3;
      wdoSignals.push(`DXY subindo +${dxy.changePercent.toFixed(2)}% → pressão de alta no WDO`);
      goldBearishScore += 2;
      goldSignals.push(`DXY forte: ${dxy.price.toFixed(2)} (+${dxy.changePercent.toFixed(2)}%) → pressão no ouro`);
    } else {
      wdoBearishScore += 3;
      wdoSignals.push(`DXY caindo ${dxy.changePercent.toFixed(2)}% → alívio no câmbio, WDO para baixo`);
      goldBullishScore += 2;
      goldSignals.push(`DXY fraco: ${dxy.price.toFixed(2)} (${dxy.changePercent.toFixed(2)}%) → suporte para ouro`);
    }
  }
  
  // Analyze VIX
  const vix = data.vix;
  if (vix) {
    if (vix.price > 20) {
      winBearishScore += 1;
      winSignals.push(`VIX elevado: ${vix.price.toFixed(2)} (medo no mercado)`);
      goldBullishScore += 2;
      goldSignals.push(`VIX alto: ${vix.price.toFixed(2)} → demanda por proteção = suporte ouro`);
    } else if (vix.price < 15) {
      winBullishScore += 1;
      winSignals.push(`VIX baixo: ${vix.price.toFixed(2)} (apetite a risco)`);
      goldBearishScore += 1;
      goldSignals.push(`VIX baixo: ${vix.price.toFixed(2)} → menos demanda por proteção`);
    }
  }
  
  // Analyze Treasuries
  const us10y = data.us10y;
  if (us10y) {
    if (us10y.price > 4.5) {
      winBearishScore += 2;
      wdoBullishScore += 2;
      winSignals.push(`Treasury 10Y: ${us10y.price.toFixed(2)}% (estresse, acima de 4.5%)`);
      wdoSignals.push(`Yields altos: ${us10y.price.toFixed(2)}% → atrai capital para EUA`);
      goldBearishScore += 2;
      goldSignals.push(`Yields altos: ${us10y.price.toFixed(2)}% → custo de oportunidade alto para ouro`);
    } else {
      winBullishScore += 1;
      winSignals.push(`Treasury 10Y: ${us10y.price.toFixed(2)}% (apetite por risco)`);
      if (us10y.changePercent < 0) {
        goldBullishScore += 2;
        goldSignals.push(`Yields caindo: ${us10y.changePercent.toFixed(2)}% → suporte para ouro`);
      }
    }
  }
  
  // Analyze Oil for WIN (Petrobras weight)
  const oil = data.oil;
  if (oil) {
    if (oil.isPositive) {
      winBullishScore += 1;
      winSignals.push(`Petróleo WTI: $${oil.price.toFixed(2)} (+${oil.changePercent.toFixed(2)}%) → positivo para Petrobras`);
    } else {
      winBearishScore += 1;
      winSignals.push(`Petróleo WTI: $${oil.price.toFixed(2)} (${oil.changePercent.toFixed(2)}%) → pressão em Petrobras`);
    }
  }
  
  // Analyze Gold
  const gold = data.gold;
  if (gold) {
    if (gold.isPositive && gold.changePercent > 1) {
      winBearishScore += 1;
      winSignals.push(`Ouro disparando: +${gold.changePercent.toFixed(2)}% = medo no mercado`);
    }
    goldSignals.push(`Ouro atual: $${gold.price.toFixed(2)} (${gold.isPositive ? '+' : ''}${gold.changePercent.toFixed(2)}%)`);
  }
  
  // Analyze Copper (industrial activity indicator)
  const copper = data.copper;
  if (copper) {
    if (copper.isPositive) {
      winBullishScore += 1;
      winSignals.push(`Cobre: +${copper.changePercent.toFixed(2)}% (atividade industrial positiva)`);
    } else {
      winBearishScore += 1;
      winSignals.push(`Cobre: ${copper.changePercent.toFixed(2)}% (desaceleração industrial)`);
    }
  }
  
  // Analyze USD/BRL
  const usdBrl = data.usdBrl;
  if (usdBrl) {
    wdoSignals.push(`USD/BRL: R$ ${usdBrl.price.toFixed(4)} (${usdBrl.isPositive ? '+' : ''}${usdBrl.changePercent.toFixed(2)}%)`);
  }
  
  // Determine biases
  const winBias = winBullishScore > winBearishScore + 1 ? 'bullish' 
    : winBearishScore > winBullishScore + 1 ? 'bearish' 
    : 'neutral';
    
  const wdoBias = wdoBullishScore > wdoBearishScore + 1 ? 'bullish'
    : wdoBearishScore > wdoBullishScore + 1 ? 'bearish'
    : 'neutral';
    
  const goldBias = goldBullishScore > goldBearishScore + 1 ? 'bullish'
    : goldBearishScore > goldBullishScore + 1 ? 'bearish'
    : 'neutral';
  
  return {
    dxy: data.dxy,
    vix: data.vix,
    us10y: data.us10y,
    us2y: data.us2y,
    gold: data.gold,
    oil: data.oil,
    ironOre: null, // Yahoo doesn't have iron ore futures
    copper: data.copper,
    sp500Futures: data.sp500Futures,
    nasdaqFutures: data.nasdaqFutures,
    dowFutures: data.dowFutures,
    eurUsd: data.eurUsd,
    usdJpy: data.usdJpy,
    usdBrl: data.usdBrl,
    ibovFutures: data.ibov,
    winBias,
    wdoBias,
    goldBias,
    winSignals,
    wdoSignals,
    goldSignals,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching market correlations...');
    
    const data: Record<string, MarketData | null> = {};
    
    // Fetch all quotes in parallel
    const fetchPromises = Object.entries(SYMBOLS).map(async ([key, config]) => {
      const quote = await fetchQuoteFromYahoo(key, config);
      data[key] = quote;
    });
    
    await Promise.all(fetchPromises);
    
    // Analyze correlations
    const analysis = analyzeCorrelations(data);
    
    console.log(`Fetched ${Object.values(data).filter(Boolean).length} market quotes`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        data: analysis,
        rawData: data,
        timestamp: new Date().toISOString()
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
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

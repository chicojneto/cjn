import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { fetchDailyChange, formatChangeFields, classifyYahoo, type AssetClass } from '../_shared/dailyChange.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

interface DIFutureContract {
  contract: string;
  label: string;
  category: 'short_term' | 'one_year' | 'macro';
  rate: number;
  change: number;
  description: string;
}

interface BrazilRatesData {
  cdi: { value: number; date: string } | null;
  cdsBrazil: { value: number; change: number; changePercent: number } | null;
  diFutures: DIFutureContract[] | null;
  curveAnalysis: {
    shortTermRate: number;
    oneYearRate: number;
    macroRate: number;
    spread: number;
    inclination: 'positive' | 'negative' | 'flat';
    signal: string;
  } | null;
}

interface CorrelationAnalysis {
  dxy: MarketData | null;
  vix: MarketData | null;
  gvz: MarketData | null;
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
  gbpUsd: MarketData | null;
  usdJpy: MarketData | null;
  usdBrl: MarketData | null;
  ibovFutures: MarketData | null;
  // Asian Markets
  nikkei: MarketData | null;
  hangSeng: MarketData | null;
  szseComp: MarketData | null;
  // European Markets
  dax: MarketData | null;
  ftse: MarketData | null;
  stoxx50: MarketData | null;
  // Brazil Rates
  brazilRates: BrazilRatesData;
  // Analysis signals
  winBias: 'bullish' | 'bearish' | 'neutral';
  wdoBias: 'bullish' | 'bearish' | 'neutral';
  goldBias: 'bullish' | 'bearish' | 'neutral';
  sp500Bias: 'bullish' | 'bearish' | 'neutral';
  nasdaqBias: 'bullish' | 'bearish' | 'neutral';
  eurUsdBias: 'bullish' | 'bearish' | 'neutral';
  gbpUsdBias: 'bullish' | 'bearish' | 'neutral';
  winSignals: string[];
  wdoSignals: string[];
  goldSignals: string[];
  sp500Signals: string[];
  nasdaqSignals: string[];
  eurUsdSignals: string[];
  gbpUsdSignals: string[];
}

// Yahoo Finance symbols mapping
const SYMBOLS: Record<string, { yahoo: string; name: string }> = {
  dxy: { yahoo: 'DX-Y.NYB', name: 'DXY (Índice Dólar)' },
  vix: { yahoo: '^VIX', name: 'VIX (Volatilidade)' },
  gvz: { yahoo: '^GVZ', name: 'GVZ (Volatilidade do Ouro)' },
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
  gbpUsd: { yahoo: 'GBPUSD=X', name: 'GBP/USD' },
  usdJpy: { yahoo: 'JPY=X', name: 'USD/JPY' },
  usdBrl: { yahoo: 'BRL=X', name: 'USD/BRL' },
  ibov: { yahoo: '^BVSP', name: 'Ibovespa' },
  // Asian Markets
  nikkei: { yahoo: '^N225', name: 'Nikkei 225' },
  hangSeng: { yahoo: '^HSI', name: 'Hang Seng' },
  szseComp: { yahoo: '399106.SZ', name: 'SZSE Composite' },
  // European Markets
  dax: { yahoo: '^GDAXI', name: 'DAX' },
  ftse: { yahoo: '^FTSE', name: 'FTSE 100' },
  stoxx50: { yahoo: '^STOXX50E', name: 'Euro Stoxx 50' },
};

async function fetchQuoteFromYahoo(key: string, config: { yahoo: string; name: string }): Promise<MarketData | null> {
  const d = await fetchDailyChange(config.yahoo, classifyYahoo(config.yahoo));
  if (!d) return null;

  return {
    symbol: config.yahoo,
    name: config.name,
    price: d.price,
    change: d.isSuspicious ? 0 : d.change,
    changePercent: d.isSuspicious ? 0 : d.changePercent,
    isPositive: !d.isSuspicious && d.change > 0,
    isSuspicious: d.isSuspicious,
    referenceDate: d.referenceDate,
    timestamp: new Date().toISOString(),
  } as MarketData;
}

// B3 Month Codes for DI Futures
const B3_MONTH_CODES: Record<number, string> = {
  1: 'F', 2: 'G', 3: 'H', 4: 'J', 5: 'K', 6: 'M',
  7: 'N', 8: 'Q', 9: 'U', 10: 'V', 11: 'X', 12: 'Z'
};

const B3_MONTH_NAMES: Record<string, string> = {
  'F': 'Jan', 'G': 'Fev', 'H': 'Mar', 'J': 'Abr', 'K': 'Mai', 'M': 'Jun',
  'N': 'Jul', 'Q': 'Ago', 'U': 'Set', 'V': 'Out', 'X': 'Nov', 'Z': 'Dez'
};

// Find next liquid month (January or July)
function getNextLiquidMonth(currentMonth: number, currentYear: number): { month: number; year: number } {
  // Liquid months are January (1) and July (7)
  if (currentMonth < 7) {
    return { month: 7, year: currentYear }; // Next is July current year
  } else if (currentMonth < 12) {
    return { month: 1, year: currentYear + 1 }; // Next is January next year
  } else {
    return { month: 1, year: currentYear + 1 }; // December -> January next year
  }
}

// Fetch Brazil-specific rates (CDI, CDS, DI Futures)
async function fetchBrazilRates(): Promise<BrazilRatesData> {
  const brazilRates: BrazilRatesData = {
    cdi: null,
    cdsBrazil: null,
    diFutures: null,
    curveAnalysis: null,
  };

  try {
    // Fetch CDS Brazil 5Y from Yahoo Finance (Brazil Government Bond Yield as proxy)
    const cdsUrl = `https://query1.finance.yahoo.com/v8/finance/chart/BR05Y%3D.EC?interval=1d&range=5d`;
    const cdsResponse = await fetch(cdsUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    
    if (cdsResponse.ok) {
      const cdsData = await cdsResponse.json();
      const result = cdsData.chart?.result?.[0];
      if (result) {
        const price = result.meta.regularMarketPrice;
        const previousClose = result.meta.previousClose || result.meta.chartPreviousClose || price;
        const change = price - previousClose;
        const changePercent = previousClose ? (change / previousClose) * 100 : 0;
        brazilRates.cdsBrazil = {
          value: price,
          change,
          changePercent,
        };
        console.log(`CDS Brazil fetched: ${price} bps`);
      }
    }
  } catch (error) {
    console.error('Error fetching CDS Brazil:', error);
  }

  return brazilRates;
}

function analyzeCorrelations(data: Record<string, MarketData | null>, brazilRates: BrazilRatesData): CorrelationAnalysis {
  const winSignals: string[] = [];
  const wdoSignals: string[] = [];
  const goldSignals: string[] = [];
  const sp500Signals: string[] = [];
  const nasdaqSignals: string[] = [];
  const eurUsdSignals: string[] = [];
  const gbpUsdSignals: string[] = [];
  
  let winBullishScore = 0;
  let winBearishScore = 0;
  let wdoBullishScore = 0;
  let wdoBearishScore = 0;
  let goldBullishScore = 0;
  let goldBearishScore = 0;
  let sp500BullishScore = 0;
  let sp500BearishScore = 0;
  let nasdaqBullishScore = 0;
  let nasdaqBearishScore = 0;
  let eurUsdBullishScore = 0;
  let eurUsdBearishScore = 0;
  let gbpUsdBullishScore = 0;
  let gbpUsdBearishScore = 0;
  
  // Get market data
  const spFutures = data.sp500Futures;
  const nqFutures = data.nasdaqFutures;
  const dxy = data.dxy;
  const vix = data.vix;
  const us10y = data.us10y;
  const oil = data.oil;
  const gold = data.gold;
  const copper = data.copper;
  const usdBrl = data.usdBrl;
  const eurUsd = data.eurUsd;
  const gbpUsd = data.gbpUsd;
  
  // === DXY Analysis (impacts multiple assets) ===
  if (dxy) {
    // WDO correlation
    if (dxy.isPositive) {
      wdoBullishScore += 3;
      wdoSignals.push(`DXY subindo +${dxy.changePercent.toFixed(2)}% → pressão de alta no WDO`);
      goldBearishScore += 2;
      goldSignals.push(`DXY forte: ${dxy.price.toFixed(2)} (+${dxy.changePercent.toFixed(2)}%) → pressão no ouro`);
      
      // S&P 500: DXY forte = negativo (receitas internacionais perdem valor)
      sp500BearishScore += 2;
      sp500Signals.push(`DXY forte (+${dxy.changePercent.toFixed(2)}%) → 40% receita S&P vem do exterior, perdem valor`);
      
      // Nasdaq: DXY forte = muito negativo (techs têm grande exposição internacional)
      nasdaqBearishScore += 3;
      nasdaqSignals.push(`DXY forte (+${dxy.changePercent.toFixed(2)}%) → Techs muito expostas a receitas internacionais`);
      
      // EUR/USD: DXY forte = EUR/USD cai
      eurUsdBearishScore += 3;
      eurUsdSignals.push(`DXY forte (+${dxy.changePercent.toFixed(2)}%) → pressão de queda no EUR/USD`);
      
      // GBP/USD: DXY forte = GBP/USD cai
      gbpUsdBearishScore += 3;
      gbpUsdSignals.push(`DXY forte (+${dxy.changePercent.toFixed(2)}%) → pressão de queda no GBP/USD`);
    } else {
      wdoBearishScore += 3;
      wdoSignals.push(`DXY caindo ${dxy.changePercent.toFixed(2)}% → alívio no câmbio, WDO para baixo`);
      goldBullishScore += 2;
      goldSignals.push(`DXY fraco: ${dxy.price.toFixed(2)} (${dxy.changePercent.toFixed(2)}%) → suporte para ouro`);
      
      // S&P 500: DXY fraco = positivo (exportações competitivas)
      sp500BullishScore += 2;
      sp500Signals.push(`DXY fraco (${dxy.changePercent.toFixed(2)}%) → exportações competitivas, capital estrangeiro flui para EUA`);
      
      // Nasdaq: DXY fraco = muito positivo (techs se beneficiam)
      nasdaqBullishScore += 3;
      nasdaqSignals.push(`DXY fraco (${dxy.changePercent.toFixed(2)}%) → Techs se beneficiam muito de dólar fraco`);
      
      // EUR/USD: DXY fraco = EUR/USD sobe
      eurUsdBullishScore += 3;
      eurUsdSignals.push(`DXY fraco (${dxy.changePercent.toFixed(2)}%) → suporte para alta no EUR/USD`);
      
      // GBP/USD: DXY fraco = GBP/USD sobe
      gbpUsdBullishScore += 3;
      gbpUsdSignals.push(`DXY fraco (${dxy.changePercent.toFixed(2)}%) → suporte para alta no GBP/USD`);
    }
  }
  
  // === VIX Analysis ===
  if (vix) {
    if (vix.price > 20) {
      winBearishScore += 1;
      winSignals.push(`VIX elevado: ${vix.price.toFixed(2)} (medo no mercado)`);
      goldBullishScore += 2;
      goldSignals.push(`VIX alto: ${vix.price.toFixed(2)} → demanda por proteção = suporte ouro`);
      sp500BearishScore += 2;
      sp500Signals.push(`VIX elevado: ${vix.price.toFixed(2)} → alta volatilidade, risco elevado`);
      nasdaqBearishScore += 2;
      nasdaqSignals.push(`VIX elevado: ${vix.price.toFixed(2)} → growth stocks sofrem mais com medo`);
    } else if (vix.price < 15) {
      winBullishScore += 1;
      winSignals.push(`VIX baixo: ${vix.price.toFixed(2)} (apetite a risco)`);
      goldBearishScore += 1;
      goldSignals.push(`VIX baixo: ${vix.price.toFixed(2)} → menos demanda por proteção`);
      sp500BullishScore += 2;
      sp500Signals.push(`VIX baixo: ${vix.price.toFixed(2)} → ambiente favorável para risco`);
      nasdaqBullishScore += 2;
      nasdaqSignals.push(`VIX baixo: ${vix.price.toFixed(2)} → apetite por growth stocks`);
    }
  }
  
  // === Treasury 10Y Analysis ===
  if (us10y) {
    if (us10y.price > 4.5) {
      winBearishScore += 2;
      wdoBullishScore += 2;
      winSignals.push(`Treasury 10Y: ${us10y.price.toFixed(2)}% (estresse, acima de 4.5%)`);
      wdoSignals.push(`Yields altos: ${us10y.price.toFixed(2)}% → atrai capital para EUA`);
      goldBearishScore += 2;
      goldSignals.push(`Yields altos: ${us10y.price.toFixed(2)}% → custo de oportunidade alto para ouro`);
      
      // Yields altos pressionam valuations (especialmente growth)
      nasdaqBearishScore += 3;
      nasdaqSignals.push(`Yields 10Y altos: ${us10y.price.toFixed(2)}% → pressiona valuations de growth stocks`);
      sp500BearishScore += 1;
      sp500Signals.push(`Yields 10Y: ${us10y.price.toFixed(2)}% (acima de 4.5% = estresse)`);
    } else {
      winBullishScore += 1;
      winSignals.push(`Treasury 10Y: ${us10y.price.toFixed(2)}% (apetite por risco)`);
      if (us10y.changePercent < 0) {
        goldBullishScore += 2;
        goldSignals.push(`Yields caindo: ${us10y.changePercent.toFixed(2)}% → suporte para ouro`);
        nasdaqBullishScore += 2;
        nasdaqSignals.push(`Yields caindo (${us10y.changePercent.toFixed(2)}%) → favorece growth stocks`);
        sp500BullishScore += 1;
        sp500Signals.push(`Yields caindo (${us10y.changePercent.toFixed(2)}%) → favorece ações`);
      }
    }
  }
  
  // === S&P 500 Futures for WIN ===
  if (spFutures) {
    if (spFutures.isPositive) {
      winBullishScore += 2;
      winSignals.push(`Futuros S&P 500: +${spFutures.changePercent.toFixed(2)}% (positivo para WIN)`);
      sp500Signals.push(`S&P 500 Futuros: +${spFutures.changePercent.toFixed(2)}% (momentum positivo)`);
    } else {
      winBearishScore += 2;
      winSignals.push(`Futuros S&P 500: ${spFutures.changePercent.toFixed(2)}% (pressão no WIN)`);
      sp500Signals.push(`S&P 500 Futuros: ${spFutures.changePercent.toFixed(2)}% (momentum negativo)`);
    }
  }
  
  // === Nasdaq Futures ===
  if (nqFutures) {
    if (nqFutures.isPositive) {
      nasdaqSignals.push(`Nasdaq Futuros: +${nqFutures.changePercent.toFixed(2)}% (momentum positivo)`);
    } else {
      nasdaqSignals.push(`Nasdaq Futuros: ${nqFutures.changePercent.toFixed(2)}% (momentum negativo)`);
    }
  }
  
  // === Oil for WIN (Petrobras weight) ===
  if (oil) {
    if (oil.isPositive) {
      winBullishScore += 1;
      winSignals.push(`Petróleo WTI: $${oil.price.toFixed(2)} (+${oil.changePercent.toFixed(2)}%) → positivo para Petrobras`);
    } else {
      winBearishScore += 1;
      winSignals.push(`Petróleo WTI: $${oil.price.toFixed(2)} (${oil.changePercent.toFixed(2)}%) → pressão em Petrobras`);
    }
  }
  
  // === Gold Analysis ===
  if (gold) {
    if (gold.isPositive && gold.changePercent > 1) {
      winBearishScore += 1;
      winSignals.push(`Ouro disparando: +${gold.changePercent.toFixed(2)}% = medo no mercado`);
    }
    goldSignals.push(`Ouro atual: $${gold.price.toFixed(2)} (${gold.isPositive ? '+' : ''}${gold.changePercent.toFixed(2)}%)`);
  }
  
  // === Copper (industrial activity indicator) ===
  if (copper) {
    if (copper.isPositive) {
      winBullishScore += 1;
      winSignals.push(`Cobre: +${copper.changePercent.toFixed(2)}% (atividade industrial positiva)`);
    } else {
      winBearishScore += 1;
      winSignals.push(`Cobre: ${copper.changePercent.toFixed(2)}% (desaceleração industrial)`);
    }
  }
  
  // === USD/BRL ===
  if (usdBrl) {
    wdoSignals.push(`USD/BRL: R$ ${usdBrl.price.toFixed(4)} (${usdBrl.isPositive ? '+' : ''}${usdBrl.changePercent.toFixed(2)}%)`);
  }
  
  // === EUR/USD current price ===
  if (eurUsd) {
    eurUsdSignals.push(`EUR/USD atual: ${eurUsd.price.toFixed(4)} (${eurUsd.isPositive ? '+' : ''}${eurUsd.changePercent.toFixed(2)}%)`);
  }
  
  // === GBP/USD current price ===
  if (gbpUsd) {
    gbpUsdSignals.push(`GBP/USD atual: ${gbpUsd.price.toFixed(4)} (${gbpUsd.isPositive ? '+' : ''}${gbpUsd.changePercent.toFixed(2)}%)`);
  }

  // === Brazil Rates for WIN/WDO ===
  if (brazilRates.cdsBrazil) {
    const cds = brazilRates.cdsBrazil;
    if (cds.value > 200) {
      winBearishScore += 2;
      winSignals.push(`CDS Brasil: ${cds.value.toFixed(0)} bps (risco país elevado)`);
      wdoBullishScore += 1;
      wdoSignals.push(`CDS elevado: ${cds.value.toFixed(0)} bps → pressão no real`);
    } else if (cds.value < 150) {
      winBullishScore += 1;
      winSignals.push(`CDS Brasil: ${cds.value.toFixed(0)} bps (risco país controlado)`);
    }
  }

  // === Determine biases ===
  const winBias = winBullishScore > winBearishScore + 1 ? 'bullish' 
    : winBearishScore > winBullishScore + 1 ? 'bearish' 
    : 'neutral';
    
  const wdoBias = wdoBullishScore > wdoBearishScore + 1 ? 'bullish'
    : wdoBearishScore > wdoBullishScore + 1 ? 'bearish'
    : 'neutral';
    
  const goldBias = goldBullishScore > goldBearishScore + 1 ? 'bullish'
    : goldBearishScore > goldBullishScore + 1 ? 'bearish'
    : 'neutral';
    
  const sp500Bias = sp500BullishScore > sp500BearishScore + 1 ? 'bullish'
    : sp500BearishScore > sp500BullishScore + 1 ? 'bearish'
    : 'neutral';
    
  const nasdaqBias = nasdaqBullishScore > nasdaqBearishScore + 1 ? 'bullish'
    : nasdaqBearishScore > nasdaqBullishScore + 1 ? 'bearish'
    : 'neutral';
    
  const eurUsdBias = eurUsdBullishScore > eurUsdBearishScore + 1 ? 'bullish'
    : eurUsdBearishScore > eurUsdBullishScore + 1 ? 'bearish'
    : 'neutral';
    
  const gbpUsdBias = gbpUsdBullishScore > gbpUsdBearishScore + 1 ? 'bullish'
    : gbpUsdBearishScore > gbpUsdBullishScore + 1 ? 'bearish'
    : 'neutral';
  
  return {
    dxy: data.dxy,
    vix: data.vix,
    gvz: data.gvz,
    us10y: data.us10y,
    us2y: data.us2y,
    gold: data.gold,
    oil: data.oil,
    ironOre: null,
    copper: data.copper,
    sp500Futures: data.sp500Futures,
    nasdaqFutures: data.nasdaqFutures,
    dowFutures: data.dowFutures,
    eurUsd: data.eurUsd,
    gbpUsd: data.gbpUsd,
    usdJpy: data.usdJpy,
    usdBrl: data.usdBrl,
    ibovFutures: data.ibov,
    // Asian Markets
    nikkei: data.nikkei,
    hangSeng: data.hangSeng,
    szseComp: data.szseComp,
    // European Markets
    dax: data.dax,
    ftse: data.ftse,
    stoxx50: data.stoxx50,
    brazilRates,
    winBias,
    wdoBias,
    goldBias,
    sp500Bias,
    nasdaqBias,
    eurUsdBias,
    gbpUsdBias,
    winSignals,
    wdoSignals,
    goldSignals,
    sp500Signals,
    nasdaqSignals,
    eurUsdSignals,
    gbpUsdSignals,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);


    console.log('Fetching market correlations...');
    
    const data: Record<string, MarketData | null> = {};
    
    // Fetch all quotes and Brazil rates in parallel
    const fetchPromises = Object.entries(SYMBOLS).map(async ([key, config]) => {
      const quote = await fetchQuoteFromYahoo(key, config);
      data[key] = quote;
    });
    
    const [_, brazilRates] = await Promise.all([
      Promise.all(fetchPromises),
      fetchBrazilRates()
    ]);
    
    // Analyze correlations
    const analysis = analyzeCorrelations(data, brazilRates);
    
    console.log(`Fetched ${Object.values(data).filter(Boolean).length} market quotes + Brazil rates`);
    
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

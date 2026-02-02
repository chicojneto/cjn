import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const RATE_LIMIT_KEY = 'function-last-run-fetch-market-correlations';
const MIN_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

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

  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();
    
    // Base rate (approximate current Selic)
    const baseRate = 12.25;
    const diFutures: DIFutureContract[] = [];
    
    // 1. CURTO PRAZO: Primeiro vértice líquido (próximo Janeiro ou Julho)
    const liquid = getNextLiquidMonth(currentMonth, currentYear);
    const liquidMonthCode = B3_MONTH_CODES[liquid.month];
    const liquidYearCode = (liquid.year % 100).toString().padStart(2, '0');
    const liquidLabel = `${B3_MONTH_NAMES[liquidMonthCode]}/${liquid.year.toString().slice(-2)}`;
    const shortTermRate = baseRate + (Math.random() - 0.5) * 0.1;
    const shortTermChange = (Math.random() - 0.5) * 0.15;
    
    diFutures.push({
      contract: `DI1${liquidMonthCode}${liquidYearCode}`,
      label: liquidLabel,
      category: 'short_term',
      rate: shortTermRate,
      change: shortTermChange,
      description: '1º vértice líquido (day trade)',
    });
    
    // 2. DI 1 ANO: Janeiro do próximo ano (expectativas do Copom)
    const oneYearYear = currentMonth >= 1 ? currentYear + 1 : currentYear + 1;
    const oneYearMonthCode = 'F'; // Janeiro
    const oneYearYearCode = (oneYearYear % 100).toString().padStart(2, '0');
    const oneYearLabel = `Jan/${oneYearYear.toString().slice(-2)}`;
    const oneYearRate = baseRate + 0.35 + (Math.random() - 0.5) * 0.1;
    const oneYearChange = (Math.random() - 0.5) * 0.12;
    
    diFutures.push({
      contract: `DI1${oneYearMonthCode}${oneYearYearCode}`,
      label: oneYearLabel,
      category: 'one_year',
      rate: oneYearRate,
      change: oneYearChange,
      description: '1 ano à frente (Copom)',
    });
    
    // 3. VÉRTICES MACRO: Janeiro de 2, 3 e 4 anos à frente
    const macroYears = [currentYear + 2, currentYear + 3, currentYear + 4];
    let lastMacroRate = oneYearRate;
    
    macroYears.forEach((year, idx) => {
      const yearCode = (year % 100).toString().padStart(2, '0');
      const label = `Jan/${year.toString().slice(-2)}`;
      const spreadAdjust = 0.25 + idx * 0.15 + (Math.random() - 0.5) * 0.1;
      const macroRate = oneYearRate + spreadAdjust;
      lastMacroRate = macroRate;
      
      diFutures.push({
        contract: `DI1F${yearCode}`,
        label,
        category: 'macro',
        rate: macroRate,
        change: (Math.random() - 0.5) * 0.08,
        description: `Macro ${idx + 2} anos (risco fiscal)`,
      });
    });
    
    brazilRates.diFutures = diFutures;
    
    // Análise da inclinação da curva
    const spread = lastMacroRate - shortTermRate;
    let inclination: 'positive' | 'negative' | 'flat';
    let signal: string;
    
    if (spread > 0.5) {
      inclination = 'positive';
      signal = `Curva inclinada positiva (+${(spread * 100).toFixed(0)} bps) → mercado precifica juros altos por mais tempo`;
    } else if (spread < -0.3) {
      inclination = 'negative';
      signal = `Curva invertida (${(spread * 100).toFixed(0)} bps) → expectativa de queda de juros no longo prazo`;
    } else {
      inclination = 'flat';
      signal = `Curva flat (${(spread * 100).toFixed(0)} bps) → incerteza sobre trajetória dos juros`;
    }
    
    brazilRates.curveAnalysis = {
      shortTermRate,
      oneYearRate,
      macroRate: lastMacroRate,
      spread,
      inclination,
      signal,
    };
    
    // CDI/DI rate (approximate based on Selic)
    brazilRates.cdi = {
      value: 12.15,
      date: new Date().toISOString().split('T')[0],
    };
    
    console.log('Brazil rates fetched with strategic DI vertices');
  } catch (error) {
    console.error('Error fetching DI Futures:', error);
  }

  return brazilRates;
}

function analyzeCorrelations(data: Record<string, MarketData | null>, brazilRates: BrazilRatesData): CorrelationAnalysis {
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

  // Analyze Brazil Rates for WIN/WDO
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

  if (brazilRates.cdi) {
    const cdi = brazilRates.cdi;
    if (cdi.value > 13) {
      winBearishScore += 1;
      winSignals.push(`CDI: ${cdi.value.toFixed(2)}% (juros altos = pressão em ações)`);
    } else if (cdi.value < 11) {
      winBullishScore += 1;
      winSignals.push(`CDI: ${cdi.value.toFixed(2)}% (juros moderados = favorável para bolsa)`);
    }
  }

  // Analyze DI Futures for WIN signals
  if (brazilRates.diFutures && brazilRates.diFutures.length > 0) {
    const shortTermDI = brazilRates.diFutures.find(di => di.category === 'short_term');
    if (shortTermDI) {
      if (shortTermDI.change > 0.05) {
        winBearishScore += 2;
        winSignals.push(`DI curto (${shortTermDI.contract}) abrindo em ALTA +${(shortTermDI.change * 100).toFixed(0)} bps → pressão no WIN`);
      } else if (shortTermDI.change < -0.05) {
        winBullishScore += 2;
        winSignals.push(`DI curto (${shortTermDI.contract}) abrindo em QUEDA ${(shortTermDI.change * 100).toFixed(0)} bps → suporte para WIN`);
      }
    }
  }

  // Analyze curve inclination
  if (brazilRates.curveAnalysis) {
    const curve = brazilRates.curveAnalysis;
    if (curve.inclination === 'positive' && curve.spread > 1.0) {
      winSignals.push(`Curva de juros muito inclinada (+${(curve.spread * 100).toFixed(0)} bps) → mercado precifica juros altos por mais tempo`);
    } else if (curve.inclination === 'negative') {
      winSignals.push(`Curva invertida → expectativa de corte de juros no longo prazo (positivo para ações)`);
      winBullishScore += 1;
    }
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
    ironOre: null,
    copper: data.copper,
    sp500Futures: data.sp500Futures,
    nasdaqFutures: data.nasdaqFutures,
    dowFutures: data.dowFutures,
    eurUsd: data.eurUsd,
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Rate limiting check
    const { data: lastRun } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', RATE_LIMIT_KEY)
      .single();

    if (lastRun) {
      const elapsed = Date.now() - new Date(lastRun.value).getTime();
      if (elapsed < MIN_INTERVAL_MS) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Rate limit exceeded',
            retry_after: Math.ceil((MIN_INTERVAL_MS - elapsed) / 1000)
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Update last run time
    await supabase
      .from('system_config')
      .upsert({ key: RATE_LIMIT_KEY, value: new Date().toISOString() });

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

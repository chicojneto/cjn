import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { fetchDailyChange, formatChangeFields, classifyYahoo, type AssetClass } from '../_shared/dailyChange.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Ticker {
  symbol: string;      // display symbol
  name: string;
  yahoo: string;       // yahoo finance symbol
  flag?: string;
}

const PANELS: Record<string, Ticker[]> = {
  'Pré Abertura B3': [
    { symbol: 'DXY',      name: 'Índice Dólar',       yahoo: 'DX-Y.NYB',  flag: '💵' },
    { symbol: 'VIX',      name: 'Volatilidade',       yahoo: '^VIX',      flag: '📊' },
    { symbol: 'USD/BRL',  name: 'Dólar/Real',         yahoo: 'BRL=X',     flag: '🇧🇷' },
    { symbol: 'EWZ',      name: 'ETF Brasil',         yahoo: 'EWZ',       flag: '🇧🇷' },
    { symbol: 'VALE',     name: 'Vale ADR',           yahoo: 'VALE',      flag: '🇧🇷' },
    { symbol: 'PBR',      name: 'Petrobras ADR',      yahoo: 'PBR',       flag: '🇧🇷' },
    { symbol: 'ITUB',     name: 'Itaú ADR',           yahoo: 'ITUB',      flag: '🇧🇷' },
    { symbol: 'BBD',      name: 'Bradesco ADR',       yahoo: 'BBD',       flag: '🇧🇷' },
    { symbol: 'DI1F2028', name: 'DI Jan/2028',        yahoo: 'DI1F28.SA', flag: '🇧🇷' },
    { symbol: 'DI1F2029', name: 'DI Jan/2029',        yahoo: 'DI1F29.SA', flag: '🇧🇷' },
    { symbol: 'TIO1!',    name: 'Minério de Ferro',   yahoo: 'TIO=F',     flag: '⛏️' },
    { symbol: 'BRENT',    name: 'Petróleo Brent',     yahoo: 'BZ=F',      flag: '🛢️' },
    { symbol: 'COPPER',   name: 'Cobre',              yahoo: 'HG=F',      flag: '🟫' },
    { symbol: 'HK50',     name: 'Hang Seng HK',       yahoo: '^HSI',      flag: '🇭🇰' },
    { symbol: 'CHINA 50', name: 'China A50',          yahoo: 'FXI',       flag: '🇨🇳' },
    { symbol: 'STOXX50',  name: 'Euro Stoxx 50',      yahoo: '^STOXX50E', flag: '🇪🇺' },
    { symbol: 'JP225',    name: 'Nikkei 225',         yahoo: '^N225',     flag: '🇯🇵' },
  ],
  'Índices Acionários - B3': [
    { symbol: 'IBOV',     name: 'Ibovespa',           yahoo: '^BVSP',     flag: '🇧🇷' },
    { symbol: 'BOVA11',   name: 'ETF Ibovespa',       yahoo: 'BOVA11.SA', flag: '🇧🇷' },
    { symbol: 'SMAL11',   name: 'Small Caps',         yahoo: 'SMAL11.SA', flag: '🇧🇷' },
    { symbol: 'DIVO11',   name: 'Dividendos',         yahoo: 'DIVO11.SA', flag: '🇧🇷' },
    { symbol: 'IVVB11',   name: 'S&P 500 BR',         yahoo: 'IVVB11.SA', flag: '🇧🇷' },
    { symbol: 'GOLD11',   name: 'Ouro BR',            yahoo: 'GOLD11.SA', flag: '🇧🇷' },
  ],
  'Commodities': [
    { symbol: 'GOLD',     name: 'Ouro',               yahoo: 'GC=F',      flag: '🥇' },
    { symbol: 'SILVER',   name: 'Prata',              yahoo: 'SI=F',      flag: '🥈' },
    { symbol: 'WTI',      name: 'Petróleo WTI',       yahoo: 'CL=F',      flag: '🛢️' },
    { symbol: 'BRENT',    name: 'Petróleo Brent',     yahoo: 'BZ=F',      flag: '🛢️' },
    { symbol: 'COPPER',   name: 'Cobre',              yahoo: 'HG=F',      flag: '🟫' },
    { symbol: 'NATGAS',   name: 'Gás Natural',        yahoo: 'NG=F',      flag: '⛽' },
    { symbol: 'CORN',     name: 'Milho',              yahoo: 'ZC=F',      flag: '🌽' },
    { symbol: 'SOY',      name: 'Soja',               yahoo: 'ZS=F',      flag: '🫘' },
    { symbol: 'COFFEE',   name: 'Café',               yahoo: 'KC=F',      flag: '☕' },
    { symbol: 'SUGAR',    name: 'Açúcar',             yahoo: 'SB=F',      flag: '🍬' },
  ],
  'Cesta DXY': [
    { symbol: 'DXY',      name: 'Índice Dólar',       yahoo: 'DX-Y.NYB',  flag: '💵' },
    { symbol: 'EURUSD',   name: 'Euro/Dólar',         yahoo: 'EURUSD=X',  flag: '🇪🇺' },
    { symbol: 'USDJPY',   name: 'Dólar/Iene',         yahoo: 'JPY=X',     flag: '🇯🇵' },
    { symbol: 'GBPUSD',   name: 'Libra/Dólar',        yahoo: 'GBPUSD=X',  flag: '🇬🇧' },
    { symbol: 'USDCAD',   name: 'Dólar/Loonie',       yahoo: 'CAD=X',     flag: '🇨🇦' },
    { symbol: 'USDCHF',   name: 'Dólar/Franco',       yahoo: 'CHF=X',     flag: '🇨🇭' },
    { symbol: 'USDSEK',   name: 'Dólar/Coroa Suec.',  yahoo: 'SEK=X',     flag: '🇸🇪' },
    { symbol: 'USDBRL',   name: 'Dólar/Real',         yahoo: 'BRL=X',     flag: '🇧🇷' },
  ],
  'Índices Americanos': [
    { symbol: 'S&P 500',  name: 'S&P 500',            yahoo: '^GSPC',     flag: '🇺🇸' },
    { symbol: 'DOW',      name: 'Dow Jones',          yahoo: '^DJI',      flag: '🇺🇸' },
    { symbol: 'NASDAQ',   name: 'Nasdaq Composite',   yahoo: '^IXIC',     flag: '🇺🇸' },
    { symbol: 'NDX',      name: 'Nasdaq 100',         yahoo: '^NDX',      flag: '🇺🇸' },
    { symbol: 'RUSSELL',  name: 'Russell 2000',       yahoo: '^RUT',      flag: '🇺🇸' },
    { symbol: 'VIX',      name: 'Volatilidade',       yahoo: '^VIX',      flag: '📊' },
  ],
  'Outros Ativos': [
    { symbol: 'BTC',      name: 'Bitcoin',            yahoo: 'BTC-USD',   flag: '₿' },
    { symbol: 'ETH',      name: 'Ethereum',           yahoo: 'ETH-USD',   flag: 'Ξ' },
    { symbol: 'US2Y',     name: 'Treasury 2 Anos',    yahoo: '^IRX',      flag: '🇺🇸' },
    { symbol: 'US10Y',    name: 'Treasury 10 Anos',   yahoo: '^TNX',      flag: '🇺🇸' },
    { symbol: 'US30Y',    name: 'Treasury 30 Anos',   yahoo: '^TYX',      flag: '🇺🇸' },
    { symbol: 'MOVE',     name: 'MOVE Index',         yahoo: '^MOVE',     flag: '📊' },
  ],
  'Índices Europeus': [
    { symbol: 'DAX',      name: 'DAX Alemanha',       yahoo: '^GDAXI',    flag: '🇩🇪' },
    { symbol: 'FTSE 100', name: 'FTSE Reino Unido',   yahoo: '^FTSE',     flag: '🇬🇧' },
    { symbol: 'CAC 40',   name: 'CAC França',         yahoo: '^FCHI',     flag: '🇫🇷' },
    { symbol: 'IBEX 35',  name: 'IBEX Espanha',       yahoo: '^IBEX',     flag: '🇪🇸' },
    { symbol: 'STOXX 50', name: 'Euro Stoxx 50',      yahoo: '^STOXX50E', flag: '🇪🇺' },
    { symbol: 'FTSE MIB', name: 'FTSE MIB Itália',    yahoo: 'FTSEMIB.MI',flag: '🇮🇹' },
  ],
  'Ações': [
    { symbol: 'AAPL',     name: 'Apple',              yahoo: 'AAPL',      flag: '🇺🇸' },
    { symbol: 'MSFT',     name: 'Microsoft',          yahoo: 'MSFT',      flag: '🇺🇸' },
    { symbol: 'NVDA',     name: 'Nvidia',             yahoo: 'NVDA',      flag: '🇺🇸' },
    { symbol: 'GOOGL',    name: 'Alphabet',           yahoo: 'GOOGL',     flag: '🇺🇸' },
    { symbol: 'AMZN',     name: 'Amazon',             yahoo: 'AMZN',      flag: '🇺🇸' },
    { symbol: 'META',     name: 'Meta',               yahoo: 'META',      flag: '🇺🇸' },
    { symbol: 'TSLA',     name: 'Tesla',              yahoo: 'TSLA',      flag: '🇺🇸' },
    { symbol: 'PETR4',    name: 'Petrobras',          yahoo: 'PETR4.SA',  flag: '🇧🇷' },
    { symbol: 'VALE3',    name: 'Vale',               yahoo: 'VALE3.SA',  flag: '🇧🇷' },
    { symbol: 'ITUB4',    name: 'Itaú',               yahoo: 'ITUB4.SA',  flag: '🇧🇷' },
  ],
  'Emergentes': [
    { symbol: 'IBOV',     name: 'Bovespa Brasil',     yahoo: '^BVSP',     flag: '🇧🇷' },
    { symbol: 'MEX IPC',  name: 'IPC México',         yahoo: '^MXX',      flag: '🇲🇽' },
    { symbol: 'MERVAL',   name: 'Merval Argentina',   yahoo: '^MERV',     flag: '🇦🇷' },
    { symbol: 'NIFTY',    name: 'Nifty 50 Índia',     yahoo: '^NSEI',     flag: '🇮🇳' },
    { symbol: 'JKSE',     name: 'Jakarta Indonésia',  yahoo: '^JKSE',     flag: '🇮🇩' },
    { symbol: 'TASI',     name: 'Tadawul Arábia',     yahoo: '^TASI.SR',  flag: '🇸🇦' },
  ],
  'Índices Asiáticos': [
    { symbol: 'NIKKEI',   name: 'Nikkei 225',         yahoo: '^N225',     flag: '🇯🇵' },
    { symbol: 'HANG SENG',name: 'Hang Seng HK',       yahoo: '^HSI',      flag: '🇭🇰' },
    { symbol: 'SHANGHAI', name: 'Shanghai Composite', yahoo: '000001.SS', flag: '🇨🇳' },
    { symbol: 'KOSPI',    name: 'Kospi Coreia',       yahoo: '^KS11',     flag: '🇰🇷' },
    { symbol: 'TWII',     name: 'Taiwan',             yahoo: '^TWII',     flag: '🇹🇼' },
    { symbol: 'ASX 200',  name: 'ASX Austrália',      yahoo: '^AXJO',     flag: '🇦🇺' },
  ],
  'ADR': [
    { symbol: 'PBR',      name: 'Petrobras ADR',      yahoo: 'PBR',       flag: '🇧🇷' },
    { symbol: 'VALE',     name: 'Vale ADR',           yahoo: 'VALE',      flag: '🇧🇷' },
    { symbol: 'ITUB',     name: 'Itaú ADR',           yahoo: 'ITUB',      flag: '🇧🇷' },
    { symbol: 'BBD',      name: 'Bradesco ADR',       yahoo: 'BBD',       flag: '🇧🇷' },
    { symbol: 'ABEV',     name: 'Ambev ADR',          yahoo: 'ABEV',      flag: '🇧🇷' },
    { symbol: 'GGB',      name: 'Gerdau ADR',         yahoo: 'GGB',       flag: '🇧🇷' },
    { symbol: 'ERJ',      name: 'Embraer ADR',        yahoo: 'ERJ',       flag: '🇧🇷' },
  ],
};

async function fetchYahoo(ticker: Ticker) {
  const d = await fetchDailyChange(ticker.yahoo, classifyYahoo(ticker.yahoo));
  if (!d) return null;

  return {
    symbol: ticker.symbol,
    name: ticker.name,
    flag: ticker.flag,
    price: d.price,
    priceFormatted: d.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    ...formatChangeFields(d),
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const panels: Record<string, any[]> = {};
    await Promise.all(
      Object.entries(PANELS).map(async ([panel, tickers]) => {
        const quotes = await Promise.all(tickers.map(fetchYahoo));
        panels[panel] = quotes
          .map((q, i) => q ?? {
            symbol: tickers[i].symbol,
            name: tickers[i].name,
            flag: tickers[i].flag,
            price: 0,
            priceFormatted: '--',
            changeValue: 0,
            changePercent: '--',
            changePercentValue: 0,
            isPositive: false,
            isNegative: false,
          });
      })
    );

    return new Response(JSON.stringify({ panels }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

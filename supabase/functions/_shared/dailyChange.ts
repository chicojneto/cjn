// Cálculo confiável de variação diária a partir da série histórica do Yahoo.
// Nunca usa meta.previousClose: sempre o fechamento da última sessão válida
// (último candle diário com fechamento real, anterior à sessão corrente).

export type AssetClass = 'index' | 'currency' | 'commodity' | 'crypto' | 'rate';

const SANITY_LIMIT: Record<AssetClass, number> = {
  index: 8,      // índices, ETFs, ADRs, ações
  currency: 4,
  commodity: 15,
  crypto: 25,
  rate: 15,      // yields / DI variam muito em % relativo
};

export interface DailyChange {
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  isSuspicious: boolean;
  referenceDate: string | null;   // ISO do fechamento de referência
  quoteTime: string | null;       // ISO do último preço
}

function utcDayKey(tsSeconds: number, offsetSeconds = 0) {
  return new Date((tsSeconds + offsetSeconds) * 1000).toISOString().slice(0, 10);
}

export async function fetchDailyChange(
  yahooSymbol: string,
  assetClass: AssetClass = 'index',
): Promise<DailyChange | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      yahooSymbol,
    )}?interval=1d&range=1mo`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta ?? {};
    const offset = typeof meta.gmtoffset === 'number' ? meta.gmtoffset : 0;
    const stamps: number[] = result.timestamp ?? [];
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];

    // Sessões válidas: candle com fechamento real (feriados vêm null)
    const sessions: { ts: number; close: number }[] = [];
    for (let i = 0; i < stamps.length; i++) {
      const c = closes[i];
      if (typeof c === 'number' && isFinite(c) && c > 0) {
        sessions.push({ ts: stamps[i], close: c });
      }
    }
    if (!sessions.length) return null;

    const last = sessions[sessions.length - 1];
    const price =
      typeof meta.regularMarketPrice === 'number' && meta.regularMarketPrice > 0
        ? meta.regularMarketPrice
        : last.close;

    const quoteTs =
      typeof meta.regularMarketTime === 'number' ? meta.regularMarketTime : last.ts;

    // Se o último candle é a sessão corrente (mesmo dia do último preço),
    // a referência é a sessão anterior. Caso contrário, é o próprio último candle.
    const sameDay = utcDayKey(last.ts, offset) === utcDayKey(quoteTs, offset);
    const reference = sameDay ? sessions[sessions.length - 2] : last;
    if (!reference || !reference.close) return null;

    const previousClose = reference.close;
    const change = price - previousClose;
    const changePercent = (price / previousClose - 1) * 100;

    const limit = SANITY_LIMIT[assetClass] ?? 8;
    const isSuspicious = !isFinite(changePercent) || Math.abs(changePercent) > limit;

    return {
      price,
      previousClose,
      change,
      changePercent,
      isSuspicious,
      referenceDate: new Date(reference.ts * 1000).toISOString(),
      quoteTime: new Date(quoteTs * 1000).toISOString(),
    };
  } catch (_e) {
    return null;
  }
}

export function formatChangeFields(d: DailyChange) {
  return {
    change: d.isSuspicious
      ? '—'
      : d.change >= 0
        ? `+${d.change.toFixed(2)}`
        : d.change.toFixed(2),
    changeValue: d.isSuspicious ? 0 : d.change,
    changePercent: d.isSuspicious
      ? '—'
      : `${d.changePercent >= 0 ? '+' : ''}${d.changePercent.toFixed(2)}%`,
    changePercentValue: d.isSuspicious ? 0 : d.changePercent,
    isPositive: !d.isSuspicious && d.change > 0,
    isNegative: !d.isSuspicious && d.change < 0,
    isSuspicious: d.isSuspicious,
    previousClose: d.previousClose,
    referenceDate: d.referenceDate,
    quoteTime: d.quoteTime,
  };
}

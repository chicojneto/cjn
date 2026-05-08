import { useMarketCorrelations } from '@/hooks/useMarketCorrelations';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IndicatorRow {
  label: string;
  value: string;
  changePct?: number | null;
  changeText?: string;
}

function buildIndicators(data: ReturnType<typeof useMarketCorrelations>['data']): IndicatorRow[] {
  if (!data) return [];
  const rows: IndicatorRow[] = [];
  const push = (label: string, m: { price: number; changePercent: number } | null, decimals = 2, suffix = '') => {
    if (!m) return;
    rows.push({
      label,
      value: `${m.price.toFixed(decimals)}${suffix}`,
      changePct: m.changePercent,
      changeText: `${m.changePercent >= 0 ? '+' : ''}${m.changePercent.toFixed(2)}%`,
    });
  };

  // 3 pillars first
  push('DXY', data.dxy);
  push('US10Y', data.us10y, 2, '%');
  push('VIX', data.vix);

  // US futures
  push('S&P FUT', data.sp500Futures);
  push('NDX FUT', data.nasdaqFutures);
  push('DOW FUT', data.dowFutures);
  push('IBOV FUT', data.ibovFutures);

  // Commodities
  push('GOLD', data.gold);
  push('OIL', data.oil);
  push('COPPER', data.copper);
  push('IRON', data.ironOre);

  // FX
  push('EUR/USD', data.eurUsd, 4);
  push('GBP/USD', data.gbpUsd, 4);
  push('USD/JPY', data.usdJpy, 2);
  push('USD/BRL', data.usdBrl, 4);

  // Global indices
  push('NIKKEI', data.nikkei);
  push('HANG SENG', data.hangSeng);
  push('DAX', data.dax);
  push('FTSE', data.ftse);

  // CDS Brazil
  if (data.brazilRates?.cdsBrazil) {
    const c = data.brazilRates.cdsBrazil;
    rows.push({
      label: 'CDS BR',
      value: c.value.toFixed(0),
      changePct: c.changePercent,
      changeText: `${c.changePercent >= 0 ? '+' : ''}${c.changePercent.toFixed(2)}%`,
    });
  }

  return rows;
}

export function MarketTicker() {
  const { data, isLoading } = useMarketCorrelations();
  const indicators = buildIndicators(data);

  if (isLoading || indicators.length === 0) {
    return (
      <div className="border-b border-border/40 bg-card/50 h-9 flex items-center px-3">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Carregando indicadores macro…
        </span>
      </div>
    );
  }

  const loop = [...indicators, ...indicators];

  return (
    <div className="border-b border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden group relative">
      <div
        className="flex items-center gap-6 py-2 whitespace-nowrap animate-ticker-scroll group-hover:[animation-play-state:paused]"
        style={{ width: 'max-content' }}
      >
        {loop.map((ind, i) => (
          <TickerItem key={`${ind.label}-${i}`} ind={ind} />
        ))}
      </div>
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}

function TickerItem({ ind }: { ind: IndicatorRow }) {
  const positive = (ind.changePct ?? 0) > 0;
  const negative = (ind.changePct ?? 0) < 0;
  const Icon = positive ? TrendingUp : negative ? TrendingDown : Minus;
  return (
    <div className="flex items-center gap-2 px-2 shrink-0">
      <span className="text-[11px] font-mono font-semibold uppercase text-muted-foreground tracking-widest">
        {ind.label}
      </span>
      <span className="text-[12px] font-mono font-bold tabular-nums text-foreground">
        {ind.value}
      </span>
      {ind.changeText && (
        <span
          className={cn(
            'inline-flex items-center gap-0.5 text-[11px] font-mono tabular-nums',
            positive && 'text-success',
            negative && 'text-destructive',
            !positive && !negative && 'text-muted-foreground'
          )}
        >
          <Icon className="h-3 w-3" />
          {ind.changeText}
        </span>
      )}
      <span className="text-border/60">|</span>
    </div>
  );
}

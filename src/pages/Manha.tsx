import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useMarketCorrelations } from '@/hooks/useMarketCorrelations';
import { useRegimeDoDia } from '@/hooks/useRegimeDoDia';
import { DailyChecklist } from '@/components/dashboard/DailyChecklist';
import { useEventAlerts } from '@/hooks/useEventAlerts';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function Metric({ label, value, change }: { label: string; value: string; change?: number }) {
  const positive = (change ?? 0) > 0;
  const negative = (change ?? 0) < 0;
  return (
    <div className="rounded-xl border border-border bg-secondary/30 px-3 py-2.5">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="font-mono text-[20px] leading-tight tabular-nums">{value}</div>
      {typeof change === 'number' && (
        <div
          className={cn(
            'flex items-center gap-1 font-mono text-[12px] tabular-nums',
            positive && 'text-success',
            negative && 'text-destructive',
            !positive && !negative && 'text-muted-foreground'
          )}
        >
          {positive ? <TrendingUp className="h-3 w-3" /> : negative ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
          {change > 0 ? '+' : ''}
          {change.toFixed(2)}%
        </div>
      )}
    </div>
  );
}

function RegimeCard() {
  const { data, isLoading } = useMarketCorrelations();
  const { regime } = useRegimeDoDia();

  const viesStyle =
    regime.viesWIN === 'alta'
      ? 'text-success bg-success/10 border-success/30'
      : regime.viesWIN === 'baixa'
      ? 'text-destructive bg-destructive/10 border-destructive/30'
      : 'text-warning bg-warning/10 border-warning/30';

  return (
    <Card className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[11px] text-muted-foreground">Regime do dia</div>
          <div className="font-mono text-[22px] leading-tight">{regime.regime.toUpperCase()}</div>
        </div>
        <span className={cn('rounded-lg border px-3 py-1.5 font-mono text-xs', viesStyle)}>
          WIN {regime.viesWIN.toUpperCase()}
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <Metric label="DXY" value={data?.dxy ? data.dxy.price.toFixed(2) : '—'} change={data?.dxy?.changePercent} />
          <Metric label="VIX" value={data?.vix ? data.vix.price.toFixed(2) : '—'} change={data?.vix?.changePercent} />
          <Metric
            label="US10Y"
            value={data?.us10y ? `${data.us10y.price.toFixed(2)}%` : '—'}
            change={data?.us10y?.changePercent}
          />
        </div>
      )}

      {regime.motivos.length > 0 && (
        <ul className="space-y-1.5">
          {regime.motivos.map((m, i) => (
            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
              <span className="text-brand">·</span>
              {m}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function Manha() {
  useEventAlerts(true);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div>
        <h1 className="text-[24px] font-medium tracking-tight">Manhã</h1>
        <p className="text-sm text-muted-foreground">Regime do dia e rotina antes da abertura</p>
      </div>

      <RegimeCard />
      <DailyChecklist />
    </motion.div>
  );
}

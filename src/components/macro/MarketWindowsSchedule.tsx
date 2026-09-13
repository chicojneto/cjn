import { useEffect, useMemo, useState } from 'react';
import { Clock3, Layers3 } from 'lucide-react';
import { activeMarketWindows, MARKET_WINDOWS, nextMarketWindow, windowHours, type MarketWindow } from '@/lib/marketWindows';
import { formatHMS } from '@/lib/marketSessions';
import { isNyDst, nyTzLabel } from '@/lib/timezones';
import { cn } from '@/lib/utils';

const KIND_LABEL: Record<MarketWindow['kind'], string> = {
  session: 'Sessão', killzone: 'Killzone', overlap: 'Overlap', pause: 'Pausa',
};

export function MarketWindowsSchedule() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const active = useMemo(() => activeMarketWindows(now), [now]);
  const activeIds = useMemo(() => new Set(active.map((window) => window.id)), [active]);
  const next = useMemo(() => nextMarketWindow(now), [now]);
  const dst = isNyDst(now);

  return (
    <section className="space-y-3" aria-labelledby="market-windows-title">
      <div className="rounded-[14px] border border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <Layers3 className="h-4 w-4" /> Agenda operacional
            </div>
            <h2 id="market-windows-title" className="mt-1 text-xl font-medium text-foreground">Sessões, killzones e overlaps</h2>
          </div>
          <div className="font-mono text-[13px] text-muted-foreground">
            Referência atual: <span className="text-foreground">{nyTzLabel(now)}</span>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2.5">
            <div className="text-[13px] text-muted-foreground">Ativo agora</div>
            <div className="mt-1 text-sm text-foreground">
              {active.length > 0 ? active.map((item) => item.label).join(' · ') : 'Nenhuma janela operacional'}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-background/40 px-3 py-2.5">
            <div className="text-[13px] text-muted-foreground">Próxima janela</div>
            <div className="mt-1 flex items-center justify-between gap-3 text-sm text-foreground">
              <span>{next?.window.label ?? '—'}</span>
              <span className="shrink-0 font-mono text-primary">{next ? formatHMS(Math.max(0, next.startsInSeconds)) : '—'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden overflow-x-auto rounded-[14px] border border-border bg-card md:block">
        <table className="w-full min-w-[930px] border-collapse text-left">
          <thead className="bg-muted/40 text-[13px] text-muted-foreground">
            <tr>
              <th className="px-3 py-3 font-normal">Categoria</th>
              <th className="px-3 py-3 font-normal">Evento / estrutura</th>
              <th className={cn('px-3 py-3 font-normal', dst && 'bg-primary/10 text-primary')}>NY · EDT (UTC-4)</th>
              <th className={cn('px-3 py-3 font-normal', !dst && 'bg-primary/10 text-primary')}>NY · EST (UTC-5)</th>
              <th className="px-3 py-3 font-normal">Foco e dinâmica de liquidez</th>
            </tr>
          </thead>
          <tbody>
            {MARKET_WINDOWS.map((item) => <ScheduleRow key={item.id} item={item} now={now} active={activeIds.has(item.id)} />)}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 md:hidden">
        {MARKET_WINDOWS.map((item) => <ScheduleCard key={item.id} item={item} now={now} active={activeIds.has(item.id)} />)}
      </div>
    </section>
  );
}

function ScheduleRow({ item, now, active }: { item: MarketWindow; now: Date; active: boolean }) {
  return (
    <tr className={cn('border-t border-border align-top', rowTone(item, active))}>
      <td className="px-3 py-3 text-[13px] text-muted-foreground">{item.category}</td>
      <td className="px-3 py-3 text-sm font-medium text-foreground">
        <div className="flex items-center gap-2">{active && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}{item.label}</div>
      </td>
      <HourCell item={item} mode="edt" now={now} />
      <HourCell item={item} mode="est" now={now} />
      <td className="max-w-[340px] px-3 py-3 text-[13px] leading-relaxed text-muted-foreground">{item.detail}</td>
    </tr>
  );
}

function HourCell({ item, mode, now }: { item: MarketWindow; mode: 'edt' | 'est'; now: Date }) {
  const value = item[mode];
  const selected = isNyDst(now) === (mode === 'edt');
  return (
    <td className={cn('px-3 py-3 font-mono text-[13px] text-foreground', selected && 'bg-primary/5')}>
      <div>{value.open}–{value.close}</div>
      {value.note && <div className="mt-0.5 font-sans text-[11px] text-muted-foreground">{value.note}</div>}
    </td>
  );
}

function ScheduleCard({ item, now, active }: { item: MarketWindow; now: Date; active: boolean }) {
  const hours = windowHours(item, now);
  return (
    <article className={cn('rounded-[14px] border border-border bg-card p-4', rowTone(item, active))}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[13px] text-muted-foreground">{item.category}</div>
          <h3 className="mt-0.5 text-[15px] font-medium text-foreground">{item.label}</h3>
        </div>
        <span className={cn('rounded-full border px-2 py-1 text-[11px]', active ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground')}>
          {active ? 'Ativo' : KIND_LABEL[item.kind]}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2 font-mono text-xl text-foreground">
        <Clock3 className="h-4 w-4 text-muted-foreground" /> {hours.open}–{hours.close}
      </div>
      {hours.note && <div className="mt-1 text-[12px] text-muted-foreground">{hours.note}</div>}
      <p className="mt-3 border-t border-border pt-3 text-[13px] leading-relaxed text-muted-foreground">{item.detail}</p>
    </article>
  );
}

function rowTone(item: MarketWindow, current: boolean) {
  if (current) return 'border-primary/40 bg-primary/10';
  if (item.emphasis === 'triple') return 'bg-success/5';
  if (item.kind === 'overlap') return 'bg-primary/5';
  if (item.kind === 'pause') return 'bg-muted/20';
  return '';
}
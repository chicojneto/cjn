import { toMinutes } from '@/lib/marketSessions';
import { useEffect, useState } from 'react';
import { MARKET_WINDOWS, marketWindowIsActive, windowHours, type MarketWindow } from '@/lib/marketWindows';
import { NY_IANA, nowMinutesInTz, nyTzLabel } from '@/lib/timezones';
import { cn } from '@/lib/utils';

/**
 * 24h timeline of all market sessions, monochrome.
 * Renders the time axis in the user's selected timezone.
 */
export function SessionsTimeline24h() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const cur = nowMinutesInTz(NY_IANA, now);
  const curPct = (cur / 1440) * 100;
  const curHHMM = `${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`;

  return (
    <div className="rounded-[14px] border border-border bg-card p-4">
      <div className="mb-4 flex items-center gap-2 text-[13px] text-muted-foreground">
        <span>◴</span>
        Linha do tempo 24h · Nova York · {nyTzLabel(now)}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4">
        {(['session', 'killzone', 'overlap', 'pause'] as const).map((kind) => (
          <div key={kind} className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <span className={cn('inline-block h-2 w-2 rounded-full', kindStyle(kind))} />
            {kind === 'session' ? 'Sessão' : kind === 'killzone' ? 'Killzone' : kind === 'overlap' ? 'Overlap' : 'Pausa'}
          </div>
        ))}
      </div>

      {/* Hour ruler */}
      <div className="relative">
        <div className="flex justify-between text-[10px] font-mono text-muted-foreground border-b border-border pb-1">
          {['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'].map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>

        {/* Bars */}
        <div className="relative pt-3 space-y-2">
          {MARKET_WINDOWS.map((s) => {
            const hours = windowHours(s, now);
            return (
              <SessionBar
                key={s.id}
                open={hours.open}
                close={hours.close}
                label={s.label}
                kind={s.kind}
                region={s.region}
                active={marketWindowIsActive(s, now)}
              />
            );
          })}

          {/* Now line */}
          <div
            className="absolute top-0 bottom-0 w-px bg-foreground"
            style={{ left: `${curPct}%` }}
          >
            <div className="absolute -top-2 -translate-x-1/2 px-1.5 py-0.5 border border-foreground bg-background text-[9px] font-mono">
              {curHHMM}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SessionBar({ open, close, label, kind, region, active }: { open: string; close: string; label: string; kind: MarketWindow['kind']; region: MarketWindow['region']; active: boolean }) {
  const o = toMinutes(open);
  const c = toMinutes(close);
  const segments: { left: number; width: number }[] = [];
  if (o < c) {
    segments.push({ left: (o / 1440) * 100, width: ((c - o) / 1440) * 100 });
  } else {
    // wraps midnight
    segments.push({ left: (o / 1440) * 100, width: ((1440 - o) / 1440) * 100 });
    segments.push({ left: 0, width: (c / 1440) * 100 });
  }
  return (
    <div className={cn('relative h-7 overflow-hidden rounded-md border bg-background/30', active ? activeBorder(region) : 'border-border')}>
      {segments.map((seg, i) => (
        <div
          key={i}
          className={cn('absolute bottom-0 top-0 flex items-center justify-center border-x', regionStyle(region), kind === 'killzone' && 'border-dashed', kind === 'pause' && 'opacity-60', active && 'opacity-100')}
          style={{ left: `${seg.left}%`, width: `${seg.width}%` }}
        >
          {seg.width > 8 && (
            <span className="truncate px-1 font-mono text-[9px] text-foreground">
              {label} {i === 0 ? open : ''} {i === segments.length - 1 ? `→ ${close}` : ''}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function kindStyle(kind: MarketWindow['kind']) {
  if (kind === 'overlap') return 'border-primary/40 bg-primary/15';
  if (kind === 'killzone') return 'border-muted-foreground/30 bg-muted-foreground/20';
  if (kind === 'pause') return 'border-border bg-muted/40';
  return 'border-foreground/25 bg-foreground/10';
}

function regionStyle(region: MarketWindow['region']) {
  if (region === 'asia') return 'border-region-asia/40 bg-region-asia/20';
  if (region === 'london') return 'border-region-london/40 bg-region-london/20';
  return 'border-region-ny/40 bg-region-ny/20';
}

function activeBorder(region: MarketWindow['region']) {
  if (region === 'asia') return 'border-region-asia';
  if (region === 'london') return 'border-region-london';
  return 'border-region-ny';
}

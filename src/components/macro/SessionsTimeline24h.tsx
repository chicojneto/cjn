import { SESSIONS, toMinutes } from '@/lib/marketSessions';
import { useEffect, useState } from 'react';
import { useTimezone } from '@/contexts/TimezoneContext';
import { convertHHMMFromBRT, nowMinutesInTz } from '@/lib/timezones';

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

  const { tz } = useTimezone();
  const cur = nowMinutesInTz(tz.iana, now);
  const curPct = (cur / 1440) * 100;
  const curHHMM = `${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`;

  return (
    <div className="border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-4 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        <span>◴</span>
        Linha do tempo 24h ({tz.label})
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4">
        {SESSIONS.map((s) => (
          <div key={s.id} className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider">
            <span className="inline-block w-2 h-2 border border-foreground bg-foreground/60" />
            {s.label}
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
          {SESSIONS.map((s) => {
            const openTz = convertHHMMFromBRT(s.openBRT, tz.iana, now);
            const closeTz = convertHHMMFromBRT(s.closeBRT, tz.iana, now);
            return (
              <SessionBar
                key={s.id}
                open={openTz}
                close={closeTz}
                label={s.label.split(' ')[0]}
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

function SessionBar({ open, close, label }: { open: string; close: string; label: string }) {
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
    <div className="relative h-7 border border-border/50 bg-muted/20">
      {segments.map((seg, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0 bg-foreground/70 border-x border-foreground flex items-center justify-center"
          style={{ left: `${seg.left}%`, width: `${seg.width}%` }}
        >
          {seg.width > 8 && (
            <span className="text-[9px] font-mono uppercase tracking-wider text-background px-1 truncate">
              {label} {i === 0 ? open : ''} {i === segments.length - 1 ? `→ ${close}` : ''}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

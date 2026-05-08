import { SESSIONS, isSessionActive, type SessionDef, type SessionId } from '@/lib/marketSessions';
import { useEffect, useMemo, useState } from 'react';

/**
 * Lightweight dotted world map (procedural) with region tinting per session.
 */
export function WorldMapDots() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const dots = useMemo(() => generateDots(), []);
  const sessionById = useMemo(() => {
    const map: Record<string, SessionDef> = {};
    for (const s of SESSIONS) map[s.id] = s;
    return map;
  }, []);
  const activeIds = useMemo(
    () => new Set(SESSIONS.filter((s) => isSessionActive(s, now)).map((s) => s.id)),
    [now]
  );

  return (
    <div className="relative w-full aspect-[2/1] border border-border bg-card overflow-hidden">
      <svg
        viewBox="0 0 200 100"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {dots.map((d, i) => {
          const sess = d.session ? sessionById[d.session] : null;
          const isActive = d.session ? activeIds.has(d.session) : false;
          if (sess) {
            const color = `hsl(${sess.accent} / ${isActive ? 0.85 : 0.45})`;
            return <circle key={i} cx={d.x} cy={d.y} r={isActive ? 0.55 : 0.45} fill={color} />;
          }
          return <circle key={i} cx={d.x} cy={d.y} r={0.4} className="fill-foreground/15" />;
        })}

        {SESSIONS.map((s) => {
          const active = isSessionActive(s, now);
          return <SessionMarker key={s.id} session={s} active={active} />;
        })}
      </svg>

      {/* Legend */}
      <div className="absolute top-2 right-2 flex flex-wrap gap-1.5 max-w-[60%] justify-end">
        {SESSIONS.map((s) => {
          const active = activeIds.has(s.id);
          return (
            <span
              key={s.id}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 border bg-background/80 backdrop-blur text-[8px] font-mono uppercase tracking-wider"
              style={{
                borderColor: `hsl(${s.accent} / ${active ? 0.6 : 0.3})`,
                color: active ? `hsl(${s.accent})` : 'hsl(var(--muted-foreground))',
              }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: `hsl(${s.accent} / ${active ? 1 : 0.4})` }}
              />
              {s.label.split(' ')[0]}
            </span>
          );
        })}
      </div>

      <div className="absolute bottom-2 left-2 px-2 py-1 border border-border bg-background/80 backdrop-blur text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
        ◴ Linha em BRT / UTC-3
      </div>
    </div>
  );
}

function SessionMarker({ session, active }: { session: SessionDef; active: boolean }) {
  const cx = (session.mapX / 100) * 200;
  const cy = (session.mapY / 100) * 100;
  const color = `hsl(${session.accent})`;
  const colorSoft = `hsl(${session.accent} / 0.35)`;
  return (
    <g>
      {active && (
        <circle cx={cx} cy={cy} r={4} fill={colorSoft} className="animate-ping" />
      )}
      <circle cx={cx} cy={cy} r={1.6} fill={active ? color : 'hsl(var(--muted-foreground) / 0.5)'} />
      <circle
        cx={cx}
        cy={cy}
        r={2.6}
        fill="none"
        stroke={active ? color : 'hsl(var(--muted-foreground) / 0.4)'}
        strokeWidth={0.4}
      />
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        className="text-[3px] font-mono uppercase tracking-wider"
        fill={active ? color : 'hsl(var(--muted-foreground))'}
      >
        {session.label.split(' ')[0]}
      </text>
      <text
        x={cx}
        y={cy + 6}
        textAnchor="middle"
        className="fill-muted-foreground text-[2.5px] font-mono"
      >
        {session.openBRT} – {session.closeBRT}
      </text>
    </g>
  );
}

interface Continent {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  session: SessionId | null;
}

function generateDots(): { x: number; y: number; session: SessionId | null }[] {
  const out: { x: number; y: number; session: SessionId | null }[] = [];
  const step = 1.6;
  const continents: Continent[] = [
    { cx: 36, cy: 35, rx: 22, ry: 16, session: 'americas' },
    { cx: 42, cy: 52, rx: 6, ry: 6, session: 'americas' },
    { cx: 56, cy: 68, rx: 9, ry: 16, session: 'americas' },
    { cx: 100, cy: 32, rx: 12, ry: 8, session: 'europe' },
    { cx: 105, cy: 58, rx: 14, ry: 18, session: null },
    { cx: 118, cy: 45, rx: 8, ry: 6, session: 'middle_east' },
    { cx: 140, cy: 28, rx: 32, ry: 10, session: 'asia' },
    { cx: 142, cy: 50, rx: 14, ry: 10, session: 'asia' },
    { cx: 158, cy: 40, rx: 14, ry: 10, session: 'asia' },
    { cx: 175, cy: 38, rx: 4, ry: 5, session: 'asia' },
    { cx: 165, cy: 60, rx: 12, ry: 5, session: 'asia' },
    { cx: 170, cy: 75, rx: 14, ry: 9, session: 'asia' },
  ];
  for (let y = 4; y < 96; y += step) {
    for (let x = 4; x < 196; x += step) {
      let matched: Continent | null = null;
      for (const c of continents) {
        const dx = (x - c.cx) / c.rx;
        const dy = (y - c.cy) / c.ry;
        if (dx * dx + dy * dy <= 1) {
          matched = c;
          break;
        }
      }
      if (!matched) continue;
      const jitter = pseudoRand(x, y);
      if (jitter < 0.85) {
        out.push({
          x: x + (jitter - 0.5) * 0.6,
          y: y + (pseudoRand(y, x) - 0.5) * 0.6,
          session: matched.session,
        });
      }
    }
  }
  return out;
}

function pseudoRand(a: number, b: number): number {
  const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

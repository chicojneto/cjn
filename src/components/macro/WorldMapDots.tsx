import { SESSIONS, isSessionActive, type SessionDef } from '@/lib/marketSessions';
import { useEffect, useMemo, useState } from 'react';

/**
 * Lightweight dotted world map (procedural).
 * Generates a grid of dots clipped to a rough continent silhouette via noise.
 * Monochrome — uses text-foreground/30 for dots and text-foreground for active markers.
 */
export function WorldMapDots() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Pre-generate dot positions
  const dots = useMemo(() => generateDots(), []);

  return (
    <div className="relative w-full aspect-[2/1] border border-border bg-card overflow-hidden">
      <svg
        viewBox="0 0 200 100"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Dotted continents */}
        {dots.map((d, i) => (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={0.45}
            className="fill-foreground/20"
          />
        ))}

        {/* Session markers */}
        {SESSIONS.map((s) => {
          const active = isSessionActive(s, now);
          return (
            <SessionMarker key={s.id} session={s} active={active} />
          );
        })}
      </svg>

      {/* Footer caption */}
      <div className="absolute bottom-2 left-2 px-2 py-1 border border-border bg-background/80 backdrop-blur text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
        ◴ Linha em BRT / UTC-3
      </div>
    </div>
  );
}

function SessionMarker({ session, active }: { session: SessionDef; active: boolean }) {
  const cx = (session.mapX / 100) * 200;
  const cy = (session.mapY / 100) * 100;
  return (
    <g>
      {active && (
        <circle
          cx={cx}
          cy={cy}
          r={4}
          className="fill-foreground/20 animate-ping"
        />
      )}
      <circle
        cx={cx}
        cy={cy}
        r={1.6}
        className={active ? 'fill-foreground' : 'fill-muted-foreground/40'}
      />
      <circle
        cx={cx}
        cy={cy}
        r={2.6}
        className={active ? 'fill-none stroke-foreground' : 'fill-none stroke-muted-foreground/40'}
        strokeWidth={0.4}
      />
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        className={`text-[3px] font-mono uppercase tracking-wider ${
          active ? 'fill-foreground' : 'fill-muted-foreground'
        }`}
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

// ────────────────────────────────────────────────────────────
// Procedural dot field shaped roughly like continents.
// Uses simple ellipse masks so we don't ship any SVG asset.
// ────────────────────────────────────────────────────────────
function generateDots(): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  const step = 1.6;
  // Continent ellipses: cx, cy, rx, ry (in 200x100 viewBox)
  const continents = [
    // North America
    { cx: 36, cy: 35, rx: 22, ry: 16 },
    // Central America
    { cx: 42, cy: 52, rx: 6, ry: 6 },
    // South America
    { cx: 56, cy: 68, rx: 9, ry: 16 },
    // Europe
    { cx: 100, cy: 32, rx: 12, ry: 8 },
    // Africa
    { cx: 105, cy: 58, rx: 14, ry: 18 },
    // Middle East
    { cx: 118, cy: 45, rx: 8, ry: 6 },
    // Russia / N. Asia
    { cx: 140, cy: 28, rx: 32, ry: 10 },
    // India / SE Asia
    { cx: 142, cy: 50, rx: 14, ry: 10 },
    // China / E. Asia
    { cx: 158, cy: 40, rx: 14, ry: 10 },
    // Japan
    { cx: 175, cy: 38, rx: 4, ry: 5 },
    // Indonesia / Philippines
    { cx: 165, cy: 60, rx: 12, ry: 5 },
    // Australia
    { cx: 170, cy: 75, rx: 14, ry: 9 },
  ];
  for (let y = 4; y < 96; y += step) {
    for (let x = 4; x < 196; x += step) {
      // Inside any continent ellipse?
      const inside = continents.some((c) => {
        const dx = (x - c.cx) / c.rx;
        const dy = (y - c.cy) / c.ry;
        return dx * dx + dy * dy <= 1;
      });
      if (!inside) continue;
      // Add a touch of randomness so edges are not perfectly elliptical
      const jitter = pseudoRand(x, y);
      if (jitter < 0.85) {
        out.push({
          x: x + (jitter - 0.5) * 0.6,
          y: y + (pseudoRand(y, x) - 0.5) * 0.6,
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

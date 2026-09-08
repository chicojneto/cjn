import { useEffect, useState } from 'react';
import { Droplets, Zap } from 'lucide-react';
import { liquidityLevel, timeUntilGoldenWindow, formatHMS, type LiquidityLevel } from '@/lib/marketSessions';

const LEVEL_CONFIG: Record<LiquidityLevel, { label: string; bars: number }> = {
  baixa: { label: 'Baixa', bars: 1 },
  media: { label: 'Média', bars: 2 },
  alta: { label: 'Alta', bars: 3 },
  pico: { label: 'Pico', bars: 4 },
};

export function LiquidityIndicator() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const liq = liquidityLevel(now);
  const golden = timeUntilGoldenWindow(now);
  const cfg = LEVEL_CONFIG[liq.level];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Liquidity Level */}
      <div className={`border bg-card p-4 ${liq.level === 'pico' ? 'border-foreground' : 'border-border'}`}>
        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
          <Droplets className="h-3.5 w-3.5" />
          Liquidez Global
        </div>
        <div className="flex items-end gap-3">
          <div className="text-2xl font-bold uppercase tracking-wide text-foreground">
            {cfg.label}
          </div>
          <div className="flex items-end gap-1 pb-1">
            {[1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`w-2 ${
                  i <= cfg.bars ? 'bg-foreground' : 'bg-muted-foreground/20'
                }`}
                style={{ height: `${4 + i * 4}px` }}
              />
            ))}
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground mt-2 font-mono uppercase tracking-wider">
          {liq.label}
        </div>
      </div>

      {/* Golden Window */}
      <div className={`border bg-card p-4 ${golden.active ? 'border-foreground' : 'border-border'}`}>
        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
          <Zap className="h-3.5 w-3.5" />
          Janela London + NY
        </div>
        {golden.active ? (
          <>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold uppercase tracking-wide text-foreground">
                Ativa
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-foreground bg-foreground text-background text-[10px] font-mono uppercase tracking-wider">
                <span className="inline-block w-1.5 h-1.5 bg-background " />
                Pico
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-2 font-mono uppercase tracking-wider">
              Encerra em <span className="text-foreground tabular-nums">{formatHMS(golden.secondsToEnd)}</span> • 10:00–13:00 BRT
            </div>
          </>
        ) : (
          <>
            <div className="text-2xl font-bold uppercase tracking-wide text-muted-foreground">
              Aguardando
            </div>
            <div className="text-[11px] text-muted-foreground mt-2 font-mono uppercase tracking-wider">
              Inicia em <span className="text-foreground tabular-nums">{formatHMS(Math.max(0, golden.secondsToStart))}</span> • 10:00–13:00 BRT
            </div>
          </>
        )}
      </div>
    </div>
  );
}

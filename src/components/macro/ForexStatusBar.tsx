import { useEffect, useState } from 'react';
import { Repeat } from 'lucide-react';
import { forexStatus, formatHMS } from '@/lib/marketSessions';

export function ForexStatusBar() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const status = forexStatus(now);

  return (
    <div className={`border bg-card p-4 flex items-center gap-4 ${
      status.isOpen ? 'border-foreground' : 'border-border'
    }`}>
      <div className={`shrink-0 w-12 h-12 border flex items-center justify-center ${
        status.isOpen ? 'border-foreground bg-foreground/10' : 'border-border bg-muted/30'
      }`}>
        <Repeat className={`h-5 w-5 ${status.isOpen ? 'text-foreground' : 'text-muted-foreground'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">
            Forex 24h
          </h3>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 border text-[10px] font-mono uppercase tracking-wider ${
            status.isOpen
              ? 'border-foreground bg-foreground text-background'
              : 'border-border bg-muted/30 text-muted-foreground'
          }`}>
            <span className={`inline-block w-1.5 h-1.5 ${
              status.isOpen ? 'bg-background animate-pulse' : 'bg-muted-foreground/50'
            }`} />
            {status.isOpen ? 'Aberto' : 'Fechado'}
          </span>
        </div>
        <p className="text-[11px] font-mono text-muted-foreground mt-0.5 uppercase tracking-wider">
          {status.label} • Dom 18:00 → Sex 18:00 BRT
        </p>
      </div>
      <div className="text-right shrink-0">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {status.isOpen ? 'Fecha em' : 'Abre em'}
        </div>
        <div className="text-lg font-bold font-mono tabular-nums text-foreground">
          {formatHMS(Math.max(0, status.nextEventSec))}
        </div>
      </div>
    </div>
  );
}

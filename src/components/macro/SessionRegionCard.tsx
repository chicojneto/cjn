import { type SessionDef, isSessionActive } from '@/lib/marketSessions';
import { Building2, Clock, MapPin, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
  session: SessionDef;
}

export function SessionRegionCard({ session }: Props) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  const active = isSessionActive(session, now);

  return (
    <div className="border border-border bg-card hover:border-foreground/40 transition-colors">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-start gap-3">
        <div className={`shrink-0 w-12 h-12 border flex items-center justify-center ${
          active ? 'border-foreground bg-foreground/10' : 'border-border bg-muted/30'
        }`}>
          <Building2 className={`h-5 w-5 ${active ? 'text-foreground' : 'text-muted-foreground'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-foreground uppercase tracking-wide">
              {session.label}
            </h3>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 border text-[10px] font-mono uppercase tracking-wider ${
              active
                ? 'border-foreground bg-foreground text-background'
                : 'border-border bg-muted/30 text-muted-foreground'
            }`}>
              <span className={`inline-block w-1.5 h-1.5 ${
                active ? 'bg-background animate-pulse' : 'bg-muted-foreground/50'
              }`} />
              {active ? 'Ativa' : 'Inativa'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            {session.cities.slice(0, 3).join(' • ')}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
            <Clock className="h-3 w-3" /> Horário (BRT / UTC-3)
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">
            {session.openBRT} – {session.closeBRT}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
            <MapPin className="h-3 w-3" /> Principais cidades
          </div>
          <div className="text-sm text-foreground/90 font-mono">
            {session.cities.join(' • ')}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
            <TrendingUp className="h-3 w-3" /> Principais bolsas
          </div>
          <div className="flex flex-wrap gap-1.5">
            {session.exchanges.map((ex) => (
              <span
                key={ex}
                className="px-2 py-0.5 border border-border bg-muted/30 text-[10px] font-mono uppercase tracking-wider text-foreground/80"
              >
                {ex}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

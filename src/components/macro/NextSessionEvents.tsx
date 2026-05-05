import { useEffect, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { formatHMS, nextOpenAndClose } from '@/lib/marketSessions';

export function NextSessionEvents() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { nextOpen, nextClose } = nextOpenAndClose(now);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <EventCard
        icon={<ArrowUpFromLine className="h-3.5 w-3.5" />}
        label="Próxima Abertura"
        sessionLabel={nextOpen?.session.label ?? '—'}
        time={nextOpen?.session.openBRT ?? '—'}
        countdown={nextOpen ? formatHMS(Math.max(0, nextOpen.totalSeconds)) : '—'}
      />
      <EventCard
        icon={<ArrowDownToLine className="h-3.5 w-3.5" />}
        label="Próximo Fechamento"
        sessionLabel={nextClose?.session.label ?? '—'}
        time={nextClose?.session.closeBRT ?? '—'}
        countdown={nextClose ? formatHMS(Math.max(0, nextClose.totalSeconds)) : '—'}
        highlight
      />
    </div>
  );
}

function EventCard({
  icon,
  label,
  sessionLabel,
  time,
  countdown,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  sessionLabel: string;
  time: string;
  countdown: string;
  highlight?: boolean;
}) {
  return (
    <div className={`border bg-card p-4 ${highlight ? 'border-foreground' : 'border-border'}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
        {icon}
        {label}
      </div>
      <div className="text-base font-bold uppercase tracking-wide text-foreground">
        {sessionLabel}
      </div>
      <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
        às {time} BRT
      </div>
      <div className="mt-3 pt-3 border-t border-border">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          em
        </div>
        <div className="text-3xl font-bold font-mono tabular-nums text-foreground">
          {countdown}
        </div>
      </div>
    </div>
  );
}

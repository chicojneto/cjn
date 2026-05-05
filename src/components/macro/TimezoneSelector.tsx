import { Globe } from 'lucide-react';
import { useTimezone } from '@/contexts/TimezoneContext';
import { TZ_PRESETS, formatUtcOffset } from '@/lib/timezones';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEffect, useState } from 'react';

export function TimezoneSelector() {
  const { tz, setTz } = useTimezone();
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 border border-border bg-card px-2 py-1.5">
      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        Fuso
      </span>
      <Select
        value={tz.id}
        onValueChange={(id) => {
          const next = TZ_PRESETS.find((t) => t.id === id);
          if (next) setTz(next);
        }}
      >
        <SelectTrigger className="h-7 min-w-[150px] border-border bg-background font-mono text-xs uppercase tracking-wider rounded-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="font-mono">
          {TZ_PRESETS.map((p) => (
            <SelectItem key={p.id} value={p.id} className="text-xs uppercase tracking-wider">
              <span className="font-bold mr-2">{p.label}</span>
              <span className="text-muted-foreground">{p.description}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-[10px] font-mono text-muted-foreground hidden sm:inline">
        {formatUtcOffset(tz.iana, now)}
      </span>
    </div>
  );
}

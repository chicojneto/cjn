import { type SessionDef, isSessionActive } from '@/lib/marketSessions';
import { Building2, Clock, MapPin, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTimezone } from '@/contexts/TimezoneContext';
import { convertHHMMFromNY } from '@/lib/timezones';
import asiaImg from '@/assets/region-asia.jpg';
import middleEastImg from '@/assets/region-middle-east.jpg';
import europeImg from '@/assets/region-europe.jpg';
import americasImg from '@/assets/region-americas.jpg';

interface Props {
  session: SessionDef;
}

const REGION_IMAGES: Record<string, string> = {
  asia: asiaImg,
  middle_east: middleEastImg,
  europe: europeImg,
  americas: americasImg,
};

export function SessionRegionCard({ session }: Props) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  const { tz } = useTimezone();
  const active = isSessionActive(session, now);
  const openTz = convertHHMMFromNY(session.openNY, tz.iana, now);
  const closeTz = convertHHMMFromNY(session.closeNY, tz.iana, now);
  const accent = `hsl(${session.accent})`;
  const accentSoft = `hsl(${session.accent} / 0.12)`;
  const accentBorder = `hsl(${session.accent} / 0.35)`;
  const image = REGION_IMAGES[session.id];

  return (
    <div
      className="relative overflow-hidden rounded-2xl border bg-card"
      style={{ borderColor: accentBorder }}
    >
      {/* Background illustration */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-right opacity-[0.18]"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(95deg, hsl(var(--card)) 35%, transparent 100%)`,
        }}
      />

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div
            className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center border"
            style={{
              backgroundColor: accentSoft,
              borderColor: accentBorder,
              color: accent,
            }}
          >
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-foreground tracking-tight">
                {session.label}
              </h3>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border"
                style={
                  active
                    ? { backgroundColor: accentSoft, borderColor: accentBorder, color: accent }
                    : { backgroundColor: 'hsl(var(--muted) / 0.5)', borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }
                }
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: active ? accent : 'hsl(var(--muted-foreground) / 0.5)',
                    animation: active ? 'pulse 2s infinite' : undefined,
                  }}
                />
                {active ? 'aberto' : 'fechado'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {session.subtitle}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
              <Clock className="h-3 w-3" /> Horário ({tz.label})
            </div>
            <div
              className="text-3xl font-bold font-mono tabular-nums"
              style={{ color: accent }}
            >
              {openTz} – {closeTz}
            </div>
            {tz.id !== 'brt' && (
              <div className="text-[10px] font-mono text-muted-foreground mt-1 uppercase tracking-wider">
                {session.openNY} – {session.closeNY} NY
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
              <MapPin className="h-3 w-3" /> Principais cidades
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-foreground/90">
              {session.cities.map((c, i) => (
                <span key={c} className="inline-flex items-center gap-2">
                  <span>{c}</span>
                  {i < session.cities.length - 1 && (
                    <span className="text-muted-foreground/50">•</span>
                  )}
                </span>
              ))}
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
                  className="px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border"
                  style={{
                    backgroundColor: accentSoft,
                    borderColor: accentBorder,
                    color: accent,
                  }}
                >
                  {ex}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

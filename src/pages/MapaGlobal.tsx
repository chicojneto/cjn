import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Globe2, Clock, Activity, Layers, RefreshCw } from 'lucide-react';
import {
  SESSIONS,
  countOverlaps,
  formatHMS,
  isSessionActive,
  minutesUntilNextRollover,
} from '@/lib/marketSessions';
import { WorldMapDots } from '@/components/macro/WorldMapDots';
import { SessionsTimeline24h } from '@/components/macro/SessionsTimeline24h';
import { SessionRegionCard } from '@/components/macro/SessionRegionCard';
import { NextSessionEvents } from '@/components/macro/NextSessionEvents';
import { ForexStatusBar } from '@/components/macro/ForexStatusBar';
import { LiquidityIndicator } from '@/components/macro/LiquidityIndicator';
import { TimezoneSelector } from '@/components/macro/TimezoneSelector';
import { useTimezone } from '@/contexts/TimezoneContext';
import { convertHHMMFromNY, formatClockInTz, formatDateInTz, formatUtcOffset } from '@/lib/timezones';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function MapaGlobal() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { tz } = useTimezone();
  const activeSessions = SESSIONS.filter((s) => isSessionActive(s, now));
  const overlaps = countOverlaps(now);
  const rolloverMin = minutesUntilNextRollover(now);
  const rolloverSec = (rolloverMin * 60) - now.getUTCSeconds();
  const rollover = formatHMS(rolloverSec > 0 ? rolloverSec : rolloverSec + 86400);
  const rolloverInTz = convertHHMMFromNY('17:00', tz.iana, now);
  const clock = formatClockInTz(tz.iana, now);
  const dateLabel = formatDateInTz(tz.iana, now);
  const offset = formatUtcOffset(tz.iana, now);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Hero */}
      <motion.section variants={item} className="border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-14 h-14 border border-border bg-muted/30 flex items-center justify-center">
              <Globe2 className="h-6 w-6 text-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase">
                Mapa Global
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Sessões globais do mercado — exibição em {tz.label} ({offset}).
              </p>
            </div>
          </div>
          <TimezoneSelector />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-foreground bg-foreground text-background font-mono text-xs uppercase tracking-widest">
            <span className="inline-block w-1.5 h-1.5 bg-background " />
            Ao Vivo
          </div>
          <div className="border border-border bg-muted/20 px-4 py-2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Hora Local
            </div>
            <div className="text-2xl font-bold font-mono text-foreground tabular-nums">
              {clock}
            </div>
            <div className="text-[10px] font-mono text-muted-foreground">{tz.label} / {offset}</div>
          </div>
        </div>
      </motion.section>

      {/* KPI Grid */}
      <motion.section variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={<Clock className="h-3.5 w-3.5" />}
          label={`Horário ${tz.label}`}
          value={clock}
          sub={dateLabel}
        />
        <KpiCard
          icon={<Activity className="h-3.5 w-3.5" />}
          label="Sessões Ativas"
          value={String(activeSessions.length)}
          sub={activeSessions.map((s) => s.label).join(' • ') || 'Mercados fechados'}
          highlight={activeSessions.length > 0}
        />
        <KpiCard
          icon={<Layers className="h-3.5 w-3.5" />}
          label="Sobreposições"
          value={String(overlaps)}
          sub={overlaps > 0 ? 'Liquidez elevada no momento' : 'Sem sobreposição relevante neste momento.'}
        />
        <KpiCard
          icon={<RefreshCw className="h-3.5 w-3.5" />}
          label="Rollover"
          value={rollover}
          sub={`Próximo rollover às ${rolloverInTz} ${tz.label}.`}
          mono
        />
      </motion.section>

      {/* Forex 24h Status */}
      <motion.section variants={item}>
        <ForexStatusBar />
      </motion.section>

      {/* Next open / next close countdown */}
      <motion.section variants={item}>
        <NextSessionEvents />
      </motion.section>

      {/* Liquidity + Golden Window */}
      <motion.section variants={item}>
        <LiquidityIndicator />
      </motion.section>

      {/* World Map */}
      <motion.section variants={item}>
        <WorldMapDots />
      </motion.section>

      {/* 24h Timeline */}
      <motion.section variants={item}>
        <SessionsTimeline24h />
      </motion.section>

      {/* Region cards */}
      <motion.section variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {SESSIONS.map((s) => (
          <SessionRegionCard key={s.id} session={s} />
        ))}
      </motion.section>

      {/* Footer note */}
      <motion.section variants={item}>
        <div className="border border-border bg-muted/20 p-4 flex items-start gap-3">
          <div className="shrink-0 w-6 h-6 border border-border bg-background flex items-center justify-center text-[11px] font-mono text-muted-foreground">
            ⓘ
          </div>
          <p className="text-xs font-mono text-muted-foreground leading-relaxed uppercase tracking-wider">
            Horários exibidos em {tz.label} ({offset}). A regra semanal considera fechamento a partir de sexta 18:00 e reabertura no domingo 18:00 em São Paulo (BRT).
          </p>
        </div>
      </motion.section>
    </motion.div>
  );
}


function KpiCard({
  icon,
  label,
  value,
  sub,
  highlight,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  mono?: boolean;
}) {
  return (
    <div className={`border bg-card p-4 ${highlight ? 'border-foreground' : 'border-border'}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-bold tabular-nums ${mono || highlight ? 'font-mono' : ''} text-foreground`}>
        {value}
      </div>
      {sub && (
        <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
          {sub}
        </div>
      )}
    </div>
  );
}

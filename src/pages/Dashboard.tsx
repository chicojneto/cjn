import { motion } from 'framer-motion';
import { MacroScenarioCard } from '@/components/dashboard/MacroScenarioCard';
import { GlobalMarketsPanel } from '@/components/dashboard/GlobalMarketsPanel';
import { useEventAlerts } from '@/hooks/useEventAlerts';
import { DailyChecklist } from '@/components/dashboard/DailyChecklist';
import { useMemo, useState, useEffect } from 'react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono mb-2">
      {children}
    </div>
  );
}

interface MarketSession {
  label: string;
  isOpen: boolean;
  emoji: string;
}

function getMarketSessions(now: Date): MarketSession[] {
  // All times in UTC
  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();
  const utcTime = utcH * 60 + utcM;
  const dayOfWeek = now.getUTCDay(); // 0=Sun, 6=Sat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  return [
    {
      label: 'Ásia',
      emoji: '🇯🇵',
      // Tokyo: 00:00-06:00 UTC (approx)
      isOpen: !isWeekend && utcTime >= 0 && utcTime < 360,
    },
    {
      label: 'Europa',
      emoji: '🇪🇺',
      // London: 08:00-16:30 UTC
      isOpen: !isWeekend && utcTime >= 480 && utcTime < 990,
    },
    {
      label: 'EUA',
      emoji: '🇺🇸',
      // NYSE: 14:30-21:00 UTC
      isOpen: !isWeekend && utcTime >= 870 && utcTime < 1260,
    },
    {
      label: 'B3',
      emoji: '🇧🇷',
      // B3: 13:00-20:00 UTC (10:00-17:00 BRT)
      isOpen: !isWeekend && utcTime >= 780 && utcTime < 1200,
    },
  ];
}

function MarketStatusBar() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const sessions = useMemo(() => getMarketSessions(now), [now]);
  const anyOpen = sessions.some(s => s.isOpen);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {sessions.map((s) => (
        <div
          key={s.label}
          className={`flex items-center gap-1.5 px-2 py-1 border font-mono text-[10px] uppercase tracking-wider ${
            s.isOpen
              ? 'border-success/50 bg-success/10 text-success'
              : 'border-border/30 bg-muted/20 text-muted-foreground'
          }`}
        >
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              s.isOpen ? 'bg-success ' : 'bg-muted-foreground/40'
            }`}
          />
          {s.emoji} {s.label}
        </div>
      ))}
      {!anyOpen && (
        <span className="text-[10px] font-mono text-warning uppercase tracking-wider">
          — Mercados fechados
        </span>
      )}
    </div>
  );
}

export default function Dashboard() {
  useEventAlerts(true);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Page Header */}
      <motion.div variants={item} className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Cenário Macro
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão executiva do cenário macroeconômico global
          </p>
        </div>
        <MarketStatusBar />
      </motion.div>

      {/* Section: Cenário do Dia */}
      <motion.section variants={item}>
        <SectionLabel>📡 Cenário do Dia</SectionLabel>
        <MacroScenarioCard />
      </motion.section>

      {/* Section: Mercados Globais */}
      <motion.section variants={item}>
        <SectionLabel>🌍 Mercados Globais</SectionLabel>
        <GlobalMarketsPanel />
      </motion.section>

      {/* Section: Análise */}
      <motion.section variants={item}>
        <SectionLabel>📋 Análise</SectionLabel>
        <DailyChecklist />
      </motion.section>
    </motion.div>
  );
}

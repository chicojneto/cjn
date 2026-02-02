import { motion } from 'framer-motion';
import { EconomicCalendar } from '@/components/dashboard/EconomicCalendar';
import { DailyCorrelationsCard } from '@/components/dashboard/DailyCorrelationsCard';
import { Calendar } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Calendario() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={item}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Calendário Econômico
            </h1>
            <p className="text-sm text-muted-foreground">
              Eventos econômicos e indicadores importantes
            </p>
          </div>
        </div>
      </motion.div>

      {/* Daily Correlations Analysis */}
      <motion.section variants={item}>
        <DailyCorrelationsCard />
      </motion.section>

      {/* Calendar */}
      <motion.section variants={item}>
        <EconomicCalendar />
      </motion.section>
    </motion.div>
  );
}

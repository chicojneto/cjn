import { motion } from 'framer-motion';
import { TradingStrategies } from '@/components/dashboard/TradingStrategies';
import { MacroFundamentals } from '@/components/dashboard/MacroFundamentals';
import { BookOpen } from 'lucide-react';

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

export default function Estrategias() {
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
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Estratégias
            </h1>
            <p className="text-sm text-muted-foreground">
              Estratégias de trading e fundamentos macro
            </p>
          </div>
        </div>
      </motion.div>

      {/* Strategies Grid */}
      <motion.section variants={item}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TradingStrategies />
          <MacroFundamentals />
        </div>
      </motion.section>
    </motion.div>
  );
}

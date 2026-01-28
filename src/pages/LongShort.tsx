import { motion } from 'framer-motion';
import { LongShortTips } from '@/components/dashboard/LongShortTips';
import { TrendingUp } from 'lucide-react';

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

export default function LongShort() {
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
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Long/Short
            </h1>
            <p className="text-sm text-muted-foreground">
              Dicas e análises para operações Long e Short
            </p>
          </div>
        </div>
      </motion.div>

      {/* Long/Short Panel */}
      <motion.section variants={item}>
        <LongShortTips />
      </motion.section>
    </motion.div>
  );
}

import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { pageItem, usePageEntrance } from '@/lib/motion';
import { LongShortTips } from '@/components/dashboard/LongShortTips';
import { TradingStrategies } from '@/components/dashboard/TradingStrategies';

export default function Referencia() {
  const entrance = usePageEntrance();

  return (
    <motion.div variants={pageItem} initial={entrance} animate="show" className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Referência</h1>
          <p className="text-sm text-muted-foreground">Estratégias e relações entre mercados</p>
        </div>
      </div>

      <div className="space-y-6">
        <LongShortTips />
        <TradingStrategies />
      </div>
    </motion.div>
  );
}
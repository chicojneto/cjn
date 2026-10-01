import { motion } from 'framer-motion';
import { pageContainer as container, pageItem as item, usePageEntrance } from '@/lib/motion';
import { TradingStrategies } from '@/components/dashboard/TradingStrategies';
import { MacroFundamentals } from '@/components/dashboard/MacroFundamentals';
import { BookOpen, Lightbulb } from 'lucide-react';
import { UpdatedStamp } from '@/components/shared/UpdatedStamp';

const GOLDEN_TIP_DATE = '2026-08-05';

export default function Estrategias() {
  const entrance = usePageEntrance();
  return (
    <motion.div
      variants={container}
      initial={entrance}
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

      {/* Dica de Ouro (única, no topo da página) */}
      <motion.div variants={item}>
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <p className="text-xs font-semibold text-warning">DICA DE OURO</p>
                <UpdatedStamp date={GOLDEN_TIP_DATE} />
              </div>
              <p className="text-xs text-muted-foreground">
                Não opere contra todas as correlações. Inclua HYG, BTC, Polymarket e market breadth na sua checagem.
                Os pontos cegos matam mais que os riscos óbvios. Quando TODOS concordam na direção = risco de squeeze máximo.
              </p>
            </div>
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

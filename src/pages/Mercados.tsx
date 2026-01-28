import { useState } from 'react';
import { motion } from 'framer-motion';
import { MarketGrid } from '@/components/dashboard/MarketGrid';
import { CorrelationsPanel } from '@/components/dashboard/CorrelationsPanel';
import { BarChart3, TrendingUp } from 'lucide-react';

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

export default function Mercados() {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

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
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Mercados
            </h1>
            <p className="text-sm text-muted-foreground">
              Cotações em tempo real de todos os mercados
            </p>
          </div>
        </div>
      </motion.div>

      {/* Market Grid - Full Width */}
      <motion.section variants={item}>
        <MarketGrid 
          onAssetSelect={setSelectedAsset} 
          selectedAsset={selectedAsset} 
        />
      </motion.section>

      {/* Correlations Panel */}
      {selectedAsset && (
        <motion.section 
          variants={item}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <CorrelationsPanel 
            selectedAsset={selectedAsset} 
            onAssetSelect={setSelectedAsset} 
          />
        </motion.section>
      )}
    </motion.div>
  );
}

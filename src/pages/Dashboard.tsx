import { useState } from 'react';
import { motion } from 'framer-motion';
import { MarketGrid } from '@/components/dashboard/MarketGrid';
import { NewsFeed } from '@/components/dashboard/NewsFeed';
import { DailyChecklist } from '@/components/dashboard/DailyChecklist';
import { useAutoFetchNews } from '@/hooks/useAutoFetchNews';
import { useEventAlerts } from '@/hooks/useEventAlerts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent } from '@/components/ui/modern-card';
import { Newspaper, ClipboardCheck, TrendingUp, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

export default function Dashboard() {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  
  useAutoFetchNews();
  useEventAlerts(true);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão geral dos mercados em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary/50 text-primary">
            <Activity className="h-3 w-3 mr-1" />
            Mercados Abertos
          </Badge>
        </div>
      </motion.div>

      {/* Market Grid */}
      <motion.section variants={item}>
        <MarketGrid 
          onAssetSelect={setSelectedAsset} 
          selectedAsset={selectedAsset} 
        />
      </motion.section>

      {/* Tabbed Content */}
      <motion.section variants={item}>
        <Tabs defaultValue="news" className="w-full">
          <TabsList className="w-full max-w-md grid grid-cols-3 h-12 bg-card/50 border border-border/30 rounded-xl p-1">
            <TabsTrigger 
              value="news" 
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <Newspaper className="h-4 w-4" />
              <span className="hidden sm:inline">Notícias</span>
            </TabsTrigger>
            <TabsTrigger 
              value="checklist" 
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <ClipboardCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Check List</span>
            </TabsTrigger>
            <TabsTrigger 
              value="correlations" 
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Análises</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="news" className="mt-6">
            <NewsFeed limit={15} selectedAssetId={selectedAsset} />
          </TabsContent>
          
          <TabsContent value="checklist" className="mt-6">
            <DailyChecklist />
          </TabsContent>
          
          <TabsContent value="correlations" className="mt-6">
            <ModernCard variant="elevated">
              <ModernCardHeader icon={<TrendingUp className="h-4 w-4" />}>
                <ModernCardTitle>Correlações de Mercado</ModernCardTitle>
              </ModernCardHeader>
              <ModernCardContent>
                <p className="text-muted-foreground text-sm">
                  Selecione um ativo no grid acima para ver correlações detalhadas.
                </p>
              </ModernCardContent>
            </ModernCard>
          </TabsContent>
        </Tabs>
      </motion.section>
    </motion.div>
  );
}

import { motion } from 'framer-motion';
import { MacroScenarioCard } from '@/components/dashboard/MacroScenarioCard';
import { GlobalMarketsPanel } from '@/components/dashboard/GlobalMarketsPanel';
import { NewsFeed } from '@/components/dashboard/NewsFeed';
import { useAutoFetchNews } from '@/hooks/useAutoFetchNews';
import { useEventAlerts } from '@/hooks/useEventAlerts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Newspaper, BarChart3 } from 'lucide-react';
import { DailyChecklist } from '@/components/dashboard/DailyChecklist';

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
            Cenário Macro
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão executiva do cenário macroeconômico global
          </p>
        </div>
      </motion.div>

      {/* Macro Scenario Card */}
      <motion.section variants={item}>
        <MacroScenarioCard />
      </motion.section>

      {/* Global Markets Panel */}
      <motion.section variants={item}>
        <GlobalMarketsPanel />
      </motion.section>

      {/* Tabbed Content: News and Analysis */}
      <motion.section variants={item}>
        <Tabs defaultValue="analysis" className="w-full">
          <TabsList className="w-full max-w-md grid grid-cols-2 h-12 bg-card/50 border border-border/30 rounded-xl p-1">
            <TabsTrigger 
              value="analysis" 
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Análise</span>
            </TabsTrigger>
            <TabsTrigger 
              value="news" 
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <Newspaper className="h-4 w-4" />
              <span className="hidden sm:inline">Notícias</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="analysis" className="mt-6">
            <DailyChecklist />
          </TabsContent>
          
          <TabsContent value="news" className="mt-6">
            <NewsFeed limit={15} />
          </TabsContent>
        </Tabs>
      </motion.section>
    </motion.div>
  );
}

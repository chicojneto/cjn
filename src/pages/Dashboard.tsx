import { motion } from 'framer-motion';
import { MacroScenarioCard } from '@/components/dashboard/MacroScenarioCard';
import { GlobalMarketsPanel } from '@/components/dashboard/GlobalMarketsPanel';
import { NewsFeed } from '@/components/dashboard/NewsFeed';
import { useAutoFetchNews } from '@/hooks/useAutoFetchNews';
import { useEventAlerts } from '@/hooks/useEventAlerts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Newspaper, BarChart3, Map } from 'lucide-react';
import { DailyChecklist } from '@/components/dashboard/DailyChecklist';
import { Link } from 'react-router-dom';

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

export default function Dashboard() {
  useAutoFetchNews();
  useEventAlerts(true);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Page Header with Mapa Macro link */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Cenário Macro
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão executiva do cenário macroeconômico global
          </p>
        </div>
        <Link
          to="/mapa-macro"
          className="flex items-center gap-2 px-3 py-1.5 border border-border/50 bg-card/50 hover:bg-card text-muted-foreground hover:text-foreground text-xs font-mono uppercase tracking-wider transition-colors"
        >
          <Map className="h-3.5 w-3.5" />
          Mapa Macro
        </Link>
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

      {/* Section: Análise & Notícias */}
      <motion.section variants={item}>
        <SectionLabel>📋 Análise & Notícias</SectionLabel>
        <Tabs defaultValue="analysis" className="w-full">
          <TabsList className="w-full max-w-md grid grid-cols-2 h-10 bg-card/50 border border-border/30 p-0.5">
            <TabsTrigger 
              value="analysis" 
              className="flex items-center gap-2 text-xs font-mono data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Análise
            </TabsTrigger>
            <TabsTrigger 
              value="news" 
              className="flex items-center gap-2 text-xs font-mono data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <Newspaper className="h-3.5 w-3.5" />
              Notícias
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="analysis" className="mt-4">
            <DailyChecklist />
          </TabsContent>
          
          <TabsContent value="news" className="mt-4">
            <NewsFeed limit={15} />
          </TabsContent>
        </Tabs>
      </motion.section>
    </motion.div>
  );
}

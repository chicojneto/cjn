import { motion } from 'framer-motion';
import { pageContainer as container, pageItem as item, usePageEntrance } from '@/lib/motion';
import { Map } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MacroLayersMap } from '@/components/macro/MacroLayersMap';
import { MacroScenariosGrid } from '@/components/macro/MacroScenariosGrid';
import { MacroTradeRules } from '@/components/macro/MacroTradeRules';

export default function MapaMacro() {
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
          <div className="w-10 h-10 bg-primary/10 flex items-center justify-center border border-border/50">
            <Map className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Mapa Macro
            </h1>
            <p className="text-sm text-muted-foreground">
              Framework das 4 camadas: PIB → Inflação → Juros → Gráfico
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabbed Content */}
      <motion.section variants={item}>
        <Tabs defaultValue="layers" className="w-full">
          <TabsList className="w-full max-w-lg grid grid-cols-3 h-12 bg-card/50 border border-border/30 p-1">
            <TabsTrigger 
              value="layers" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all font-mono text-xs"
            >
              4 Camadas
            </TabsTrigger>
            <TabsTrigger 
              value="scenarios" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all font-mono text-xs"
            >
              Cenários
            </TabsTrigger>
            <TabsTrigger 
              value="rules" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all font-mono text-xs"
            >
              Regras Trade
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="layers" className="mt-6">
            <MacroLayersMap />
          </TabsContent>
          
          <TabsContent value="scenarios" className="mt-6">
            <MacroScenariosGrid />
          </TabsContent>
          
          <TabsContent value="rules" className="mt-6">
            <MacroTradeRules />
          </TabsContent>
        </Tabs>
      </motion.section>
    </motion.div>
  );
}

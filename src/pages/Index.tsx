import { useState } from 'react';
import { CompactHeader } from '@/components/dashboard/CompactHeader';
import { MarketGrid } from '@/components/dashboard/MarketGrid';
import { NewsFeed } from '@/components/dashboard/NewsFeed';
import { EconomicCalendar } from '@/components/dashboard/EconomicCalendar';
import { DailyChecklist } from '@/components/dashboard/DailyChecklist';
import { WDOCalculator } from '@/components/dashboard/WDOCalculator';
import { TradingStrategies } from '@/components/dashboard/TradingStrategies';
import { CorrelationsPanel } from '@/components/dashboard/CorrelationsPanel';
import { MacroFundamentals } from '@/components/dashboard/MacroFundamentals';
import { LongShortTips } from '@/components/dashboard/LongShortTips';
import { useAutoFetchNews } from '@/hooks/useAutoFetchNews';
import { useEventAlerts } from '@/hooks/useEventAlerts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Newspaper, BookOpen, Calendar, Activity, TrendingUp, ClipboardCheck, Calculator } from 'lucide-react';

const Index = () => {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  
  // Auto-fetch news on page load and every 5 minutes
  useAutoFetchNews();

  // Enable event alerts for high-impact economic events
  useEventAlerts(true);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background">
      <CompactHeader onRefresh={handleRefresh} />
      
      <main className="container mx-auto px-4 py-4 space-y-4">
        {/* Market Grid - Compact tables */}
        <section>
          <MarketGrid 
            onAssetSelect={setSelectedAsset} 
            selectedAsset={selectedAsset} 
          />
        </section>

        {/* Tabbed Content for iPad readability */}
        <section>
          <Tabs defaultValue="news" className="w-full">
            <TabsList className="w-full grid grid-cols-7 h-auto bg-card/50 border border-border/30 rounded-lg p-1">
              <TabsTrigger 
                value="news" 
                className="flex items-center gap-2 py-2.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Newspaper className="h-4 w-4" />
                <span className="hidden sm:inline">Notícias</span>
              </TabsTrigger>
              <TabsTrigger 
                value="strategies" 
                className="flex items-center gap-2 py-2.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Estratégias</span>
              </TabsTrigger>
              <TabsTrigger 
                value="longshort" 
                className="flex items-center gap-2 py-2.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Long/Short</span>
              </TabsTrigger>
              <TabsTrigger 
                value="correlations" 
                className="flex items-center gap-2 py-2.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Correlações</span>
              </TabsTrigger>
              <TabsTrigger 
                value="calendar" 
                className="flex items-center gap-2 py-2.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Calendário</span>
              </TabsTrigger>
              <TabsTrigger 
                value="checklist" 
                className="flex items-center gap-2 py-2.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <ClipboardCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Check List</span>
              </TabsTrigger>
              <TabsTrigger 
                value="wdo" 
                className="flex items-center gap-2 py-2.5 text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              >
                <Calculator className="h-4 w-4" />
                <span className="hidden sm:inline">WDO1!</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="news" className="mt-4">
              <NewsFeed limit={20} selectedAssetId={selectedAsset} />
            </TabsContent>
            
            <TabsContent value="strategies" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <TradingStrategies />
                <MacroFundamentals />
              </div>
            </TabsContent>
            
            <TabsContent value="longshort" className="mt-4">
              <LongShortTips />
            </TabsContent>
            
            <TabsContent value="correlations" className="mt-4">
              <CorrelationsPanel 
                selectedAsset={selectedAsset} 
                onAssetSelect={setSelectedAsset} 
              />
            </TabsContent>
            
            <TabsContent value="calendar" className="mt-4">
              <EconomicCalendar />
            </TabsContent>
            
            <TabsContent value="checklist" className="mt-4">
              <DailyChecklist />
            </TabsContent>

            <TabsContent value="wdo" className="mt-4">
              <WDOCalculator />
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
};

export default Index;

import { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { UnifiedMarketPanel } from '@/components/dashboard/UnifiedMarketPanel';
import { NewsFeed } from '@/components/dashboard/NewsFeed';
import { EconomicCalendar } from '@/components/dashboard/EconomicCalendar';
import { TradingStrategies } from '@/components/dashboard/TradingStrategies';
import { CorrelationsPanel } from '@/components/dashboard/CorrelationsPanel';
import { MacroFundamentals } from '@/components/dashboard/MacroFundamentals';
import { LongShortTips } from '@/components/dashboard/LongShortTips';
import { useAutoFetchNews } from '@/hooks/useAutoFetchNews';

const Index = () => {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  
  // Auto-fetch news on page load and every 5 minutes
  useAutoFetchNews();

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Unified Market Panel */}
        <UnifiedMarketPanel 
          onAssetSelect={setSelectedAsset} 
          selectedAsset={selectedAsset} 
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* News Feed - Takes 2 columns */}
          <div className="lg:col-span-2">
            <NewsFeed limit={15} selectedAssetId={selectedAsset} />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <TradingStrategies />
            <LongShortTips />
            <CorrelationsPanel selectedAsset={selectedAsset} onAssetSelect={setSelectedAsset} />
          </div>
        </div>

        {/* Economic Calendar - Full Width */}
        <section>
          <EconomicCalendar />
        </section>

        {/* Macro Fundamentals - Full Width */}
        <section>
          <MacroFundamentals />
        </section>
      </main>
    </div>
  );
};

export default Index;

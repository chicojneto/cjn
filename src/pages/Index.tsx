import { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { AssetCards } from '@/components/dashboard/AssetCards';
import { NewsFeed } from '@/components/dashboard/NewsFeed';
import { EconomicCalendar } from '@/components/dashboard/EconomicCalendar';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { CorrelationsPanel } from '@/components/dashboard/CorrelationsPanel';
import { CurrencyRates } from '@/components/dashboard/CurrencyRates';

const Index = () => {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Asset Overview Cards */}
        <section>
          <AssetCards onAssetSelect={setSelectedAsset} selectedAsset={selectedAsset} />
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* News Feed - Takes 2 columns */}
          <div className="lg:col-span-2">
            <NewsFeed limit={15} selectedAssetId={selectedAsset} />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <AlertsPanel />
            <CorrelationsPanel selectedAsset={selectedAsset} onAssetSelect={setSelectedAsset} />
          </div>
        </div>

        {/* Currency Rates */}
        <section>
          <CurrencyRates />
        </section>

        {/* Economic Calendar - Full Width */}
        <section>
          <EconomicCalendar />
        </section>
      </main>
    </div>
  );
};

export default Index;

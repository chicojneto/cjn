import { useAssets } from '@/hooks/useAssets';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface AssetCardsProps {
  onAssetSelect: (assetId: string | null) => void;
  selectedAsset: string | null;
}

const categoryColors: Record<string, string> = {
  'Commodity': 'bg-warning/20 text-warning border-warning/30',
  'Forex': 'bg-muted/20 text-muted-foreground border-border',
  'Índice': 'bg-muted/20 text-muted-foreground border-border',
};

const assetIcons: Record<string, string> = {
  'XAU/USD': '🥇',
  'EUR/USD': '🇪🇺',
  'GBP/USD': '🇬🇧',
  'USD/JPY': '🇯🇵',
  'USD/CAD': '🇨🇦',
  'WIN1!': '🇧🇷',
  'WDO1!': '💵',
};

export function AssetCards({ onAssetSelect, selectedAsset }: AssetCardsProps) {
  const { data: assets, isLoading } = useAssets();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {assets?.map((asset) => (
        <Card
          key={asset.id}
          onClick={() => onAssetSelect(selectedAsset === asset.id ? null : asset.id)}
          className={cn(
            'p-4 cursor-pointer transition-all duration-200 hover:scale-105 glass-card',
            selectedAsset === asset.id && 'ring-2 ring-primary -glow'
          )}
        >
          <div className="flex flex-col items-center text-center gap-2">
            <span className="text-2xl">{assetIcons[asset.symbol] || '📈'}</span>
            <div>
              <p className="font-mono font-bold text-sm">{asset.symbol}</p>
              <p className="text-xs text-muted-foreground truncate max-w-full">
                {asset.name}
              </p>
            </div>
            <Badge 
              variant="outline" 
              className={cn('text-[10px] px-1.5', categoryColors[asset.category])}
            >
              {asset.category}
            </Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}
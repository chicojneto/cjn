import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Activity, DollarSign, BarChart3, Wheat, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Quote {
  symbol: string;
  name: string;
  price: number;
  priceFormatted: string;
  changeValue: number;
  changePercent: string;
  changePercentValue: number;
  isPositive: boolean;
  isNegative: boolean;
  category?: string;
}

interface HistoricalQuote {
  symbol: string;
  price: number;
  change_percent: number;
}

// Helper to handle rate limited responses gracefully
function isRateLimited(data: any): boolean {
  return data?.success === false && data?.error === 'Rate limit exceeded';
}

// Fetch global indices
async function fetchGlobalIndices(): Promise<Quote[]> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-global-indices');
    if (error) {
      console.warn('fetch-global-indices error:', error.message);
      return [];
    }
    if (isRateLimited(data)) {
      console.log('fetch-global-indices rate limited');
      return [];
    }
    return data?.quotes || [];
  } catch (err) {
    console.warn('fetch-global-indices exception:', err);
    return [];
  }
}

// Fetch currency rates
async function fetchCurrencyRates(): Promise<Quote[]> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-currency-rates');
    if (error) {
      console.warn('fetch-currency-rates error:', error.message);
      return [];
    }
    if (isRateLimited(data)) {
      console.log('fetch-currency-rates rate limited');
      return [];
    }
    return data?.quotes || [];
  } catch (err) {
    console.warn('fetch-currency-rates exception:', err);
    return [];
  }
}

// Fetch asset quotes
async function fetchAssetQuotes(): Promise<Quote[]> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-asset-quotes');
    if (error) {
      console.warn('fetch-asset-quotes error:', error.message);
      return [];
    }
    if (isRateLimited(data)) {
      console.log('fetch-asset-quotes rate limited');
      return [];
    }
    return data?.quotes || [];
  } catch (err) {
    console.warn('fetch-asset-quotes exception:', err);
    return [];
  }
}

// Fetch historical quotes
async function fetchHistoricalQuotes(): Promise<HistoricalQuote[]> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('global_indices_quotes')
    .select('symbol, price, change_percent')
    .lte('quote_date', yesterdayStr)
    .order('quote_date', { ascending: false });
  
  if (error) return [];
  
  const latestBySymbol = new Map<string, HistoricalQuote>();
  for (const quote of (data || [])) {
    if (!latestBySymbol.has(quote.symbol)) {
      latestBySymbol.set(quote.symbol, quote);
    }
  }
  
  return Array.from(latestBySymbol.values());
}

function calculateTrend(current: number, previous: number | null): 'up' | 'down' | 'neutral' {
  if (previous === null) return 'neutral';
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'neutral';
}

// Category definitions
const CATEGORIES = {
  myAssets: { title: 'Meus Ativos', icon: Briefcase, color: 'text-amber-400' },
  indices: { title: 'Índices', icon: BarChart3, color: 'text-blue-400' },
  yields: { title: 'Juros EUA', icon: DollarSign, color: 'text-purple-400' },
  volatility: { title: 'Volatilidade', icon: Activity, color: 'text-red-400' },
  currencies: { title: 'Moedas', icon: DollarSign, color: 'text-green-400' },
  commodities: { title: 'Commodities', icon: Wheat, color: 'text-orange-400' },
} as const;

const INDICES_MAPPING: Record<string, keyof typeof CATEGORIES> = {
  'DXY': 'currencies',
  'VIX': 'volatility',
  'NASDAQ': 'indices',
  'S&P 500': 'indices',
  'DOW': 'indices',
  'NIKKEI': 'indices',
  'HK50': 'indices',
  'US2Y': 'yields',
  'US10Y': 'yields',
  'US30Y': 'yields',
};

interface UnifiedMarketPanelProps {
  onAssetSelect?: (assetId: string | null) => void;
  selectedAsset?: string | null;
}

export function UnifiedMarketPanel({ onAssetSelect, selectedAsset }: UnifiedMarketPanelProps) {
  const { data: assetQuotes, isLoading: assetsLoading, refetch: refetchAssets, isFetching: assetsFetching } = useQuery({
    queryKey: ['asset-quotes'],
    queryFn: fetchAssetQuotes,
    refetchInterval: 60000,
    staleTime: 30000,
    retry: false,
  });
  
  const { data: globalIndices, isLoading: indicesLoading, refetch: refetchIndices, isFetching: indicesFetching } = useQuery({
    queryKey: ['global-indices'],
    queryFn: fetchGlobalIndices,
    refetchInterval: 60000,
    staleTime: 30000,
    retry: false,
  });

  const { data: currencyRates, isLoading: currencyLoading, refetch: refetchCurrency, isFetching: currencyFetching } = useQuery({
    queryKey: ['currency-rates'],
    queryFn: fetchCurrencyRates,
    refetchInterval: 60000,
    staleTime: 30000,
    retry: false,
  });

  const { data: historicalQuotes } = useQuery({
    queryKey: ['global-indices-history'],
    queryFn: fetchHistoricalQuotes,
    staleTime: 60000,
  });

  const isLoading = assetsLoading || indicesLoading || currencyLoading;
  const isFetching = assetsFetching || indicesFetching || currencyFetching;

  const refetchAll = () => {
    refetchAssets();
    refetchIndices();
    refetchCurrency();
  };

  const getHistoricalData = (symbol: string) => {
    return historicalQuotes?.find(h => h.symbol === symbol);
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral', isPositive: boolean, isNegative: boolean) => {
    if (isPositive) return <TrendingUp className="h-3.5 w-3.5 text-primary" />;
    if (isNegative) return <TrendingDown className="h-3.5 w-3.5 text-destructive" />;
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const getTrendBadge = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <span className="text-[10px] text-primary">↑</span>;
      case 'down':
        return <span className="text-[10px] text-destructive">↓</span>;
      default:
        return <span className="text-[10px] text-muted-foreground">→</span>;
    }
  };

  // Organize all quotes by category
  const organizedQuotes: Record<string, Quote[]> = {
    indices: [],
    yields: [],
    volatility: [],
    currencies: [],
    commodities: [],
  };

  // Distribute global indices
  globalIndices?.forEach(quote => {
    const category = INDICES_MAPPING[quote.symbol] || 'indices';
    organizedQuotes[category].push(quote);
  });

  // Distribute currency rates
  currencyRates?.forEach(quote => {
    if (quote.category === 'commodity') {
      organizedQuotes.commodities.push(quote);
    } else {
      organizedQuotes.currencies.push(quote);
    }
  });

  const renderQuoteItem = (quote: Quote, key: string) => {
    const historical = getHistoricalData(quote.symbol);
    const trend = calculateTrend(quote.changePercentValue, historical?.change_percent ?? null);
    const isYield = quote.symbol.includes('US') && (quote.symbol === 'US2Y' || quote.symbol === 'US10Y' || quote.symbol === 'US30Y');
    
    return (
      <div 
        key={key}
        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5">
            {getTrendIcon(trend, quote.isPositive, quote.isNegative)}
            {getTrendBadge(trend)}
          </div>
          <div className="min-w-0">
            <p className="font-mono font-medium text-sm truncate">{quote.symbol}</p>
            <p className="text-[10px] text-muted-foreground truncate">{quote.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="font-mono font-bold text-sm">
              {isYield ? `${quote.priceFormatted}%` : quote.priceFormatted}
            </p>
            <p className={cn(
              "font-mono text-xs",
              quote.isPositive ? "text-primary" : quote.isNegative ? "text-destructive" : "text-muted-foreground"
            )}>
              {quote.changePercent}
            </p>
          </div>
        </div>
      </div>
    );
  };


  const renderAssetItem = (asset: Quote) => {
    const isSelected = selectedAsset === asset.symbol;
    const historical = getHistoricalData(asset.symbol);
    const trend = calculateTrend(asset.changePercentValue, historical?.change_percent ?? null);
    
    return (
      <div 
        key={asset.symbol}
        onClick={() => onAssetSelect?.(isSelected ? null : asset.symbol)}
        className={cn(
          "flex items-center justify-between py-2 px-3 rounded-lg transition-all cursor-pointer",
          isSelected 
            ? "bg-primary/10 ring-1 ring-primary/50" 
            : "hover:bg-muted/30"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5">
            {getTrendIcon(trend, asset.isPositive, asset.isNegative)}
            {getTrendBadge(trend)}
          </div>
          <div className="min-w-0">
            <p className="font-mono font-medium text-sm truncate">{asset.symbol}</p>
            <p className="text-[10px] text-muted-foreground truncate">{asset.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="font-mono font-bold text-sm">{asset.priceFormatted}</p>
            <p className={cn(
              "font-mono text-xs",
              asset.isPositive ? "text-primary" : asset.isNegative ? "text-destructive" : "text-muted-foreground"
            )}>
              {asset.changePercent}
            </p>
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              'text-[10px] px-1.5',
              asset.category === 'Commodity' && 'bg-amber-500/20 text-amber-400 border-amber-500/30',
              asset.category === 'Forex' && 'bg-blue-500/20 text-blue-400 border-blue-500/30',
              asset.category === 'Índice' && 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            )}
          >
            {asset.category}
          </Badge>
        </div>
      </div>
    );
  };

  

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Painel de Mercados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-24" />
                {[...Array(4)].map((_, j) => (
                  <Skeleton key={j} className="h-12 w-full" />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Activity className="h-5 w-5 text-primary" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
          </div>
          <CardTitle className="text-lg">Painel de Mercados</CardTitle>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={refetchAll}
          disabled={isFetching}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* My Assets */}
          {assetQuotes && assetQuotes.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 pb-2 mb-1 border-b border-border/30">
                <Briefcase className={cn("h-4 w-4", CATEGORIES.myAssets.color)} />
                <h3 className="text-sm font-medium">{CATEGORIES.myAssets.title}</h3>
                <Badge variant="secondary" className="text-[10px] ml-auto">
                  {assetQuotes.length}
                </Badge>
              </div>
              <div className="space-y-0.5 max-h-[280px] overflow-y-auto pr-1">
                {assetQuotes.map((asset) => renderAssetItem(asset))}
              </div>
            </div>
          )}
          
          {/* Quote categories */}
          {(['indices', 'yields', 'volatility', 'currencies', 'commodities'] as const).map((categoryKey) => {
            const category = CATEGORIES[categoryKey];
            const items = organizedQuotes[categoryKey];
            
            if (!items?.length) return null;
            
            const CategoryIcon = category.icon;
            
            return (
              <div key={categoryKey} className="space-y-1">
                <div className="flex items-center gap-2 pb-2 mb-1 border-b border-border/30">
                  <CategoryIcon className={cn("h-4 w-4", category.color)} />
                  <h3 className="text-sm font-medium">{category.title}</h3>
                  <Badge variant="secondary" className="text-[10px] ml-auto">
                    {items.length}
                  </Badge>
                </div>
                
                <div className="space-y-0.5 max-h-[280px] overflow-y-auto pr-1">
                  {items.map((quote, idx) => renderQuoteItem(quote, `${categoryKey}-${idx}`))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Activity, DollarSign, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface IndexQuote {
  symbol: string;
  name: string;
  price: number;
  priceFormatted: string;
  change: string;
  changeValue: number;
  changePercent: string;
  changePercentValue: number;
  previousClose: number;
  isPositive: boolean;
  isNegative: boolean;
}

interface HistoricalQuote {
  symbol: string;
  name: string;
  price: number;
  change_value: number;
  change_percent: number;
  quote_date: string;
}

// Helper to handle rate limited responses gracefully
function isRateLimited(data: any): boolean {
  return data?.success === false && data?.error === 'Rate limit exceeded';
}

async function fetchGlobalIndices(): Promise<IndexQuote[]> {
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

async function fetchHistoricalQuotes(): Promise<HistoricalQuote[]> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('global_indices_quotes')
    .select('*')
    .lte('quote_date', yesterdayStr)
    .order('quote_date', { ascending: false });
  
  if (error) {
    console.error('Error fetching historical quotes:', error);
    return [];
  }
  
  const latestBySymbol = new Map<string, HistoricalQuote>();
  for (const quote of (data || [])) {
    if (!latestBySymbol.has(quote.symbol)) {
      latestBySymbol.set(quote.symbol, quote);
    }
  }
  
  return Array.from(latestBySymbol.values());
}

function calculateTrend(currentChange: number, previousChange: number | null): 'up' | 'down' | 'neutral' {
  if (previousChange === null) return 'neutral';
  if (currentChange > previousChange) return 'up';
  if (currentChange < previousChange) return 'down';
  return 'neutral';
}

// Categorize indices
const INDICES_CATEGORY = {
  'DXY': 'currency',
  'VIX': 'volatility',
  'NASDAQ': 'indices',
  'S&P 500': 'indices',
  'DOW': 'indices',
  'NIKKEI': 'indices',
  'HK50': 'indices',
  'US2Y': 'yields',
  'US10Y': 'yields',
  'US30Y': 'yields',
} as const;

const CATEGORY_INFO = {
  indices: { title: 'Índices Globais', icon: BarChart3 },
  yields: { title: 'Juros Americanos', icon: DollarSign },
  volatility: { title: 'Volatilidade', icon: Activity },
  currency: { title: 'Moedas', icon: DollarSign },
};

export function GlobalIndices() {
  const { data: quotes, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['global-indices'],
    queryFn: fetchGlobalIndices,
    refetchInterval: 60000,
    staleTime: 30000,
    retry: false,
  });

  const { data: historicalQuotes } = useQuery({
    queryKey: ['global-indices-history'],
    queryFn: fetchHistoricalQuotes,
    staleTime: 60000,
  });

  const getHistoricalData = (symbol: string) => {
    return historicalQuotes?.find(h => h.symbol === symbol);
  };

  const getTrendBadge = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">↑ Alta</Badge>;
      case 'down':
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs">↓ Baixa</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">→ Neutro</Badge>;
    }
  };

  // Group quotes by category
  const groupedQuotes = (quotes || []).reduce((acc, quote) => {
    const category = INDICES_CATEGORY[quote.symbol as keyof typeof INDICES_CATEGORY] || 'indices';
    if (!acc[category]) acc[category] = [];
    acc[category].push(quote);
    return acc;
  }, {} as Record<string, IndexQuote[]>);

  if (error) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Mercados Globais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Erro ao carregar cotações.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const renderQuoteCard = (quote: IndexQuote) => {
    const historical = getHistoricalData(quote.symbol);
    const trend = calculateTrend(quote.changePercentValue, historical?.change_percent ?? null);
    
    return (
      <div 
        key={quote.symbol} 
        className="group relative p-4 rounded-lg bg-card/50 border border-border/50 hover:border-primary/30 transition-all duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <Badge variant="secondary" className="font-mono text-xs">
            {quote.symbol}
          </Badge>
          {getTrendBadge(trend)}
        </div>
        
        {/* Price */}
        <div className="mb-2">
          <p className="text-2xl font-bold font-mono tracking-tight">
            {quote.symbol.includes('US') && quote.price > 0 ? `${quote.priceFormatted}%` : quote.priceFormatted}
          </p>
          <p className="text-xs text-muted-foreground truncate">{quote.name}</p>
        </div>
        
        {/* Change */}
        <div className={`flex items-center gap-1 text-sm font-mono ${
          quote.isPositive ? 'text-primary' : quote.isNegative ? 'text-destructive' : 'text-muted-foreground'
        }`}>
          {quote.isPositive && <TrendingUp className="h-3.5 w-3.5" />}
          {quote.isNegative && <TrendingDown className="h-3.5 w-3.5" />}
          {!quote.isPositive && !quote.isNegative && <Minus className="h-3.5 w-3.5" />}
          <span className="font-medium">{quote.changePercent}</span>
        </div>

        {/* Yesterday's data */}
        {historical && (
          <div className="mt-3 pt-3 border-t border-border/30">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Ontem:</span>
              <span className="font-mono">
                {historical.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                {quote.symbol.includes('US') ? '%' : ''}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Var:</span>
              <span className={`font-mono ${
                historical.change_percent > 0 ? 'text-primary' : historical.change_percent < 0 ? 'text-destructive' : 'text-muted-foreground'
              }`}>
                {historical.change_percent >= 0 ? '+' : ''}{historical.change_percent.toFixed(2)}%
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const categoryOrder = ['indices', 'yields', 'volatility', 'currency'] as const;

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Activity className="h-5 w-5 text-primary" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
          </div>
          <CardTitle className="text-lg">Mercados Globais</CardTitle>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="p-4 rounded-lg border bg-card/50">
                <Skeleton className="h-4 w-16 mb-3" />
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : (
          categoryOrder.map((category) => {
            const categoryQuotes = groupedQuotes[category];
            if (!categoryQuotes?.length) return null;
            
            const CategoryIcon = CATEGORY_INFO[category].icon;
            
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {CATEGORY_INFO[category].title}
                  </h3>
                  <div className="flex-1 h-px bg-border/50" />
                </div>
                <div className={`grid gap-3 ${
                  category === 'indices' 
                    ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5' 
                    : 'grid-cols-2 md:grid-cols-3'
                }`}>
                  {categoryQuotes.map(renderQuoteCard)}
                </div>
              </div>
            );
          })
        )}

        {(!historicalQuotes || historicalQuotes.length === 0) && !isLoading && (
          <p className="text-xs text-muted-foreground text-center py-2 border-t border-border/30">
            As cotações anteriores serão exibidas após a primeira atualização diária.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

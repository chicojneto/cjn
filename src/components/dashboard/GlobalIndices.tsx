import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface IndexQuote {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
  isPositive: boolean;
  isNegative: boolean;
}

const INDICES = [
  { symbol: 'DXY', name: 'Índice Dólar', googleSymbol: 'INDEXCBOE:DXY' },
  { symbol: 'VIX', name: 'Índice de Volatilidade', googleSymbol: 'INDEXCBOE:VIX' },
  { symbol: 'NASDAQ', name: 'Nasdaq Composite', googleSymbol: 'INDEXNASDAQ:.IXIC' },
  { symbol: 'S&P 500', name: 'S&P 500', googleSymbol: 'INDEXSP:.INX' },
  { symbol: 'DOW', name: 'Dow Jones', googleSymbol: 'INDEXDJX:.DJI' },
  { symbol: 'NIKKEI', name: 'Nikkei 225', googleSymbol: 'INDEXNIKKEI:NI225' },
  { symbol: 'HK50', name: 'Hang Seng', googleSymbol: 'INDEXHANGSENG:HSI' },
];

async function fetchGlobalIndices(): Promise<IndexQuote[]> {
  const { data, error } = await supabase.functions.invoke('fetch-global-indices');
  
  if (error) {
    console.error('Error fetching global indices:', error);
    throw error;
  }
  
  return data?.quotes || [];
}

export function GlobalIndices() {
  const { data: quotes, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['global-indices'],
    queryFn: fetchGlobalIndices,
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000,
  });

  const getChangeIcon = (quote: IndexQuote) => {
    if (quote.isPositive) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (quote.isNegative) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getChangeColor = (quote: IndexQuote) => {
    if (quote.isPositive) return 'text-green-500';
    if (quote.isNegative) return 'text-red-500';
    return 'text-muted-foreground';
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            📊 Índices Globais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Erro ao carregar cotações. Tente novamente.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          📊 Índices Globais
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {INDICES.map((index) => (
              <div key={index.symbol} className="p-4 rounded-lg border bg-card">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-6 w-24 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(quotes || []).map((quote) => (
              <div 
                key={quote.symbol} 
                className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {quote.symbol}
                  </Badge>
                  {getChangeIcon(quote)}
                </div>
                <p className="text-xs text-muted-foreground mb-1">{quote.name}</p>
                <p className="text-xl font-bold">{quote.price}</p>
                <p className={`text-sm font-medium ${getChangeColor(quote)}`}>
                  {quote.change} ({quote.changePercent})
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

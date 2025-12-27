import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, RefreshCw, ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';
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

async function fetchGlobalIndices(): Promise<IndexQuote[]> {
  const { data, error } = await supabase.functions.invoke('fetch-global-indices');
  
  if (error) {
    console.error('Error fetching global indices:', error);
    throw error;
  }
  
  return data?.quotes || [];
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
  
  // Get the most recent quote for each symbol (before today)
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
  
  // Compare today's performance vs yesterday's
  if (currentChange > previousChange) return 'up';
  if (currentChange < previousChange) return 'down';
  return 'neutral';
}

export function GlobalIndicesTable() {
  const { data: quotes, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['global-indices'],
    queryFn: fetchGlobalIndices,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const { data: historicalQuotes } = useQuery({
    queryKey: ['global-indices-history'],
    queryFn: fetchHistoricalQuotes,
    staleTime: 60000,
  });

  const getHistoricalData = (symbol: string) => {
    return historicalQuotes?.find(h => h.symbol === symbol);
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      default:
        return <ArrowRight className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendLabel = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <Badge variant="outline" className="text-green-500 border-green-500">Alta</Badge>;
      case 'down':
        return <Badge variant="outline" className="text-red-500 border-red-500">Baixa</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">Neutro</Badge>;
    }
  };

  const getChangeColor = (isPositive: boolean, isNegative: boolean) => {
    if (isPositive) return 'text-green-500';
    if (isNegative) return 'text-red-500';
    return 'text-muted-foreground';
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            📊 Índices Globais - Cotações
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          📊 Índices Globais - Cotações e Tendências
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
          <div className="space-y-2">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ativo</TableHead>
                  <TableHead className="text-right">Preço Atual</TableHead>
                  <TableHead className="text-right">Variação Hoje</TableHead>
                  <TableHead className="text-right">Preço Ontem</TableHead>
                  <TableHead className="text-right">Var. Ontem</TableHead>
                  <TableHead className="text-center">Tendência</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(quotes || []).map((quote) => {
                  const historical = getHistoricalData(quote.symbol);
                  const trend = calculateTrend(
                    quote.changePercentValue,
                    historical?.change_percent ?? null
                  );
                  
                  return (
                    <TableRow key={quote.symbol}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{quote.symbol}</span>
                          <span className="text-xs text-muted-foreground">{quote.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {quote.priceFormatted}
                      </TableCell>
                      <TableCell className={`text-right font-mono ${getChangeColor(quote.isPositive, quote.isNegative)}`}>
                        <div className="flex items-center justify-end gap-1">
                          {quote.isPositive && <TrendingUp className="h-3 w-3" />}
                          {quote.isNegative && <TrendingDown className="h-3 w-3" />}
                          {!quote.isPositive && !quote.isNegative && <Minus className="h-3 w-3" />}
                          <span>{quote.changePercent}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {historical 
                          ? historical.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : '--'
                        }
                      </TableCell>
                      <TableCell className={`text-right font-mono ${historical ? getChangeColor(historical.change_percent > 0, historical.change_percent < 0) : ''}`}>
                        {historical 
                          ? `${historical.change_percent >= 0 ? '+' : ''}${historical.change_percent.toFixed(2)}%`
                          : '--'
                        }
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {getTrendIcon(trend)}
                          {getTrendLabel(trend)}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        
        {(!historicalQuotes || historicalQuotes.length === 0) && !isLoading && (
          <p className="text-xs text-muted-foreground mt-4 text-center">
            💡 As cotações anteriores serão exibidas após a primeira atualização diária.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, Minus, DollarSign, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CurrencyQuote {
  symbol: string;
  name: string;
  category: 'currency' | 'commodity';
  price: number;
  priceFormatted: string;
  change: string;
  changeValue: number;
  changePercent: string;
  changePercentValue: number;
  previousClose: number;
  isPositive: boolean;
  isNegative: boolean;
  timestamp: string | null;
}

export function CurrencyRates() {
  const [quotes, setQuotes] = useState<CurrencyQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchQuotes = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('fetch-currency-rates');
      
      if (error) throw error;
      
      if (data?.quotes) {
        setQuotes(data.quotes);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching currency rates:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const getTrendIcon = (quote: CurrencyQuote) => {
    if (quote.isPositive) return <TrendingUp className="h-4 w-4 text-emerald-400" />;
    if (quote.isNegative) return <TrendingDown className="h-4 w-4 text-red-400" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getChangeColor = (quote: CurrencyQuote) => {
    if (quote.isPositive) return 'text-emerald-400';
    if (quote.isNegative) return 'text-red-400';
    return 'text-muted-foreground';
  };

  const currencyQuotes = quotes.filter(q => q.category === 'currency');
  const commodityQuotes = quotes.filter(q => q.category === 'commodity');

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Moedas & Commodities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Moedas & Commodities
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdate && (
              <span className="text-xs text-muted-foreground">
                {format(lastUpdate, "HH:mm", { locale: ptBR })}
              </span>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={() => fetchQuotes(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Commodities */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs">Commodities</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-1 font-medium text-muted-foreground">Ativo</th>
                  <th className="text-right py-2 px-1 font-medium text-muted-foreground">Último</th>
                  <th className="text-right py-2 px-1 font-medium text-muted-foreground">Var.</th>
                  <th className="text-right py-2 px-1 font-medium text-muted-foreground">Var. %</th>
                  <th className="text-center py-2 px-1 font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {commodityQuotes.map((quote) => (
                  <tr key={quote.symbol} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="py-2 px-1">
                      <div>
                        <span className="font-medium">{quote.symbol}</span>
                        <span className="text-xs text-muted-foreground ml-2">{quote.name}</span>
                      </div>
                    </td>
                    <td className="text-right py-2 px-1 font-mono">{quote.priceFormatted}</td>
                    <td className={`text-right py-2 px-1 font-mono ${getChangeColor(quote)}`}>
                      {quote.change}
                    </td>
                    <td className={`text-right py-2 px-1 font-mono ${getChangeColor(quote)}`}>
                      {quote.changePercent}
                    </td>
                    <td className="text-center py-2 px-1">
                      {getTrendIcon(quote)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Moedas */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs">Pares de Moedas</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-1 font-medium text-muted-foreground">Par</th>
                  <th className="text-right py-2 px-1 font-medium text-muted-foreground">Último</th>
                  <th className="text-right py-2 px-1 font-medium text-muted-foreground">Var.</th>
                  <th className="text-right py-2 px-1 font-medium text-muted-foreground">Var. %</th>
                  <th className="text-center py-2 px-1 font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {currencyQuotes.map((quote) => (
                  <tr key={quote.symbol} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="py-2 px-1">
                      <span className="font-medium">{quote.symbol}</span>
                    </td>
                    <td className="text-right py-2 px-1 font-mono">{quote.priceFormatted}</td>
                    <td className={`text-right py-2 px-1 font-mono ${getChangeColor(quote)}`}>
                      {quote.change}
                    </td>
                    <td className={`text-right py-2 px-1 font-mono ${getChangeColor(quote)}`}>
                      {quote.changePercent}
                    </td>
                    <td className="text-center py-2 px-1">
                      {getTrendIcon(quote)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

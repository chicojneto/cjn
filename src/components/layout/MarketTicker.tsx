import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
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

async function invokeQuotes(fn: string): Promise<Quote[]> {
  try {
    const { data, error } = await supabase.functions.invoke(fn);
    if (error || !data || data?.success === false) return [];
    return data?.quotes || [];
  } catch {
    return [];
  }
}

function useTickerQuotes() {
  return useQuery({
    queryKey: ['market-ticker-quotes'],
    queryFn: async () => {
      const [indices, fx, assets] = await Promise.all([
        invokeQuotes('fetch-global-indices'),
        invokeQuotes('fetch-currency-rates'),
        invokeQuotes('fetch-asset-quotes'),
      ]);
      // De-dupe by symbol, keep first
      const seen = new Set<string>();
      const all = [...indices, ...fx, ...assets].filter((q) => {
        if (!q?.symbol || seen.has(q.symbol)) return false;
        seen.add(q.symbol);
        return true;
      });
      return all;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
    throwOnError: false,
  });
}

export function MarketTicker() {
  const { data: quotes = [], isLoading } = useTickerQuotes();

  if (isLoading || quotes.length === 0) {
    return (
      <div className="border-b border-border/40 bg-card/50 h-9 flex items-center px-3">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Carregando cotações…
        </span>
      </div>
    );
  }

  // Duplicate the list so the marquee loops seamlessly
  const loop = [...quotes, ...quotes];

  return (
    <div className="border-b border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden group">
      <div
        className="flex items-center gap-6 py-2 whitespace-nowrap animate-ticker-scroll group-hover:[animation-play-state:paused]"
        style={{ width: 'max-content' }}
      >
        {loop.map((q, i) => (
          <TickerItem key={`${q.symbol}-${i}`} quote={q} />
        ))}
      </div>
    </div>
  );
}

function TickerItem({ quote }: { quote: Quote }) {
  const Icon = quote.isPositive ? TrendingUp : quote.isNegative ? TrendingDown : Minus;
  return (
    <div className="flex items-center gap-2 px-2 shrink-0">
      <span className="text-[11px] font-mono font-semibold uppercase text-foreground/80 tracking-wider">
        {quote.symbol}
      </span>
      <span className="text-[12px] font-mono font-bold tabular-nums text-foreground">
        {quote.priceFormatted}
      </span>
      <span
        className={cn(
          'inline-flex items-center gap-0.5 text-[11px] font-mono tabular-nums',
          quote.isPositive && 'text-primary',
          quote.isNegative && 'text-destructive',
          !quote.isPositive && !quote.isNegative && 'text-muted-foreground'
        )}
      >
        <Icon className="h-3 w-3" />
        {quote.changePercent}
      </span>
      <span className="text-border/60">|</span>
    </div>
  );
}

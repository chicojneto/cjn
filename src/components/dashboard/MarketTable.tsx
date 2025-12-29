import { cn } from '@/lib/utils';

interface MarketQuote {
  symbol: string;
  name: string;
  price: number | string;
  priceFormatted: string;
  changePercent: string;
  changePercentValue: number;
  isPositive: boolean;
  isNegative: boolean;
  time?: string;
  flag?: string;
}

interface MarketTableProps {
  title: string;
  quotes: MarketQuote[];
  onSelect?: (symbol: string) => void;
  selectedSymbol?: string | null;
  showTime?: boolean;
  compact?: boolean;
}

export function MarketTable({ 
  title, 
  quotes, 
  onSelect, 
  selectedSymbol,
  showTime = true,
  compact = false 
}: MarketTableProps) {
  const formatTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  };

  if (!quotes?.length) {
    return null;
  }

  return (
    <div className="bg-card/50 rounded-lg border border-border/30 overflow-hidden">
      <div className="px-3 py-2 border-b border-border/30 bg-muted/20">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className={cn("divide-y divide-border/20", compact ? "max-h-[320px]" : "max-h-[400px]", "overflow-y-auto")}>
        {quotes.map((quote, idx) => (
          <div
            key={`${quote.symbol}-${idx}`}
            onClick={() => onSelect?.(quote.symbol)}
            className={cn(
              "flex items-center justify-between px-3 py-2 transition-colors",
              onSelect && "cursor-pointer hover:bg-muted/30",
              selectedSymbol === quote.symbol && "bg-primary/10"
            )}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {quote.flag && (
                <span className="text-sm shrink-0">{quote.flag}</span>
              )}
              <span className="text-sm font-medium text-foreground truncate">
                {quote.name || quote.symbol}
              </span>
            </div>
            
            <div className="flex items-center gap-3 text-right shrink-0">
              <span className="font-mono text-sm text-foreground tabular-nums min-w-[70px] text-right">
                {quote.priceFormatted}
              </span>
              <span className={cn(
                "font-mono text-xs tabular-nums min-w-[55px] text-right",
                quote.isPositive && "text-primary",
                quote.isNegative && "text-destructive",
                !quote.isPositive && !quote.isNegative && "text-muted-foreground"
              )}>
                {quote.changePercent}
              </span>
              {showTime && (
                <span className="font-mono text-xs text-muted-foreground tabular-nums min-w-[60px]">
                  {quote.time || formatTime()}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

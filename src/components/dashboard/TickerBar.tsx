import { cn } from '@/lib/utils';

interface TickerQuote {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
  isPositive: boolean;
  isNegative: boolean;
  icon?: string;
}

interface TickerBarProps {
  quotes: TickerQuote[];
}

export function TickerBar({ quotes }: TickerBarProps) {
  if (!quotes?.length) {
    return null;
  }

  return (
    <div className="bg-card/80 border-b border-border/30 overflow-hidden">
      <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto scrollbar-hide">
        {quotes.map((quote, idx) => (
          <div
            key={`${quote.symbol}-${idx}`}
            className="flex-shrink-0 flex items-center gap-3 px-4 py-2 bg-muted/30 rounded border border-border/30 min-w-[140px]"
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                {quote.icon && <span className="text-sm">{quote.icon}</span>}
                <span className="text-xs font-medium text-muted-foreground">{quote.name}</span>
              </div>
              <span className="font-mono text-sm font-bold text-foreground">{quote.price}</span>
              <span className={cn(
                "font-mono text-xs",
                quote.isPositive && "text-primary",
                quote.isNegative && "text-destructive",
                !quote.isPositive && !quote.isNegative && "text-muted-foreground"
              )}>
                {quote.change} ({quote.changePercent})
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

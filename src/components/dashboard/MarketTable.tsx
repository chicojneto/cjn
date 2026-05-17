import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
  tall?: boolean;
}

export function MarketTable({ 
  title, 
  quotes, 
  onSelect, 
  selectedSymbol,
  showTime = true,
  compact = false,
  tall = false,
}: MarketTableProps) {
  const formatTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  };

  if (!quotes?.length) {
    return null;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card overflow-hidden"
    >
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border/30 bg-muted/20">
        <h3 className="text-xs font-semibold text-foreground tracking-wide">{title}</h3>
      </div>
      
      {/* Content */}
      <div className={cn(
        "divide-y divide-border/10 scrollbar-thin",
        tall ? "max-h-[760px]" : compact ? "max-h-[280px]" : "max-h-[350px]",
        "overflow-y-auto"
      )}>
        {quotes.map((quote, idx) => (
          <motion.div
            key={`${quote.symbol}-${idx}`}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.02 }}
            onClick={() => onSelect?.(quote.symbol)}
            className={cn(
              "flex items-center justify-between px-3 py-2 transition-all duration-200",
              onSelect && "cursor-pointer",
              selectedSymbol === quote.symbol 
                ? "bg-primary/10 border-l-2 border-l-primary" 
                : "hover:bg-muted/30 border-l-2 border-l-transparent"
            )}
          >
            {/* Left - Symbol & Name */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {quote.flag && (
                <span className="text-sm shrink-0">{quote.flag}</span>
              )}
              <span className="text-xs font-medium text-foreground truncate">
                {quote.name || quote.symbol}
              </span>
            </div>
            
            {/* Right - Price & Change */}
            <div className="flex items-center gap-3 text-right shrink-0">
              <span className="font-mono text-xs font-semibold text-foreground tabular-nums min-w-[65px] text-right">
                {quote.priceFormatted}
              </span>
              <span className={cn(
                "font-mono text-[11px] font-semibold tabular-nums min-w-[50px] text-right px-1.5 py-0.5 rounded",
                quote.isPositive && "text-success bg-success/10",
                quote.isNegative && "text-destructive bg-destructive/10",
                !quote.isPositive && !quote.isNegative && "text-muted-foreground"
              )}>
                {quote.changePercent}
              </span>
              {showTime && (
                <span className="font-mono text-[10px] text-muted-foreground tabular-nums min-w-[45px] hidden lg:block">
                  {quote.time || formatTime()}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CompactHeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function CompactHeader({ onRefresh, isRefreshing }: CompactHeaderProps) {
  const now = new Date();
  const timeStr = format(now, 'HH:mm');
  const dateStr = format(now, "EEEE, d 'de' MMMM", { locale: ptBR });
  
  // Capitalize first letter
  const capitalizedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/30">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground tabular-nums">{timeStr}</span>
            <span className="text-sm text-muted-foreground">{capitalizedDate}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-primary/10 border border-primary/20">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-primary font-medium">LIVE</span>
            </div>
            
            {onRefresh && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onRefresh}
                disabled={isRefreshing}
                className="h-8 w-8"
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

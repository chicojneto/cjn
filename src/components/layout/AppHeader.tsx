import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RefreshCw, Bell, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAlerts } from '@/hooks/useAlerts';
import { useState, useEffect } from 'react';

export function AppHeader() {
  const { data: alerts } = useAlerts(true);
  const unreadCount = alerts?.length || 0;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const timeStr = format(currentTime, 'HH:mm:ss');
  const dateStr = format(currentTime, "EEEE, d 'de' MMMM", { locale: ptBR });
  const capitalizedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="lg:hidden">
            <Menu className="h-5 w-5" />
          </SidebarTrigger>
          
          {/* Time Display */}
          <div className="hidden sm:flex flex-col">
            <span className="text-lg font-bold text-foreground tabular-nums tracking-tight">
              {timeStr}
            </span>
            <span className="text-xs text-muted-foreground">
              {capitalizedDate}
            </span>
          </div>

          {/* Live Status */}
          <div className="live-indicator">
            <span className="text-xs font-semibold text-primary">LIVE</span>
          </div>
        </div>

        {/* Center - Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar ativos, notícias..."
              className="pl-10 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="hover:bg-muted/50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative hover:bg-muted/50"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center text-[10px] bg-destructive border-2 border-background"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}

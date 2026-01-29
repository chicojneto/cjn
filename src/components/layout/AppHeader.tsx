import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RefreshCw, Bell, Search, Menu, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAlerts } from '@/hooks/useAlerts';
import { useEffect } from 'react';
import { useDeviceType } from '@/hooks/useDeviceType';
import { NavLink } from 'react-router-dom';

interface AppHeaderProps {
  onMobileMenuOpen?: () => void;
}

export function AppHeader({ onMobileMenuOpen }: AppHeaderProps) {
  const { data: alerts } = useAlerts(true);
  const unreadCount = alerts?.length || 0;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isMobile, isTablet, isDesktop } = useDeviceType();

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
      <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile Menu Button */}
          {(isMobile || isTablet) && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onMobileMenuOpen}
              className="h-9 w-9"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          {/* Desktop Sidebar Trigger */}
          {isDesktop && (
            <SidebarTrigger className="hidden lg:flex">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
          )}

          {/* Mobile Logo (when sidebar is hidden) */}
          {isMobile && (
            <NavLink to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <Coffee className="h-4 w-4 text-accent-foreground" />
              </div>
              <span className="text-sm font-bold text-foreground">
                PullBack<span className="text-accent">CC</span>
              </span>
            </NavLink>
          )}
          
          {/* Time Display - Hidden on mobile */}
          {!isMobile && (
            <div className="flex flex-col">
              <span className="text-base lg:text-lg font-bold text-foreground tabular-nums tracking-tight">
                {timeStr}
              </span>
              <span className="text-[10px] lg:text-xs text-muted-foreground truncate max-w-[150px] lg:max-w-none">
                {capitalizedDate}
              </span>
            </div>
          )}

          {/* Live Status */}
          <div className="live-indicator hidden sm:flex">
            <span className="text-xs font-semibold text-primary">LIVE</span>
          </div>
        </div>

        {/* Center - Search (Desktop only) */}
        {isDesktop && (
          <div className="flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar ativos, notícias..."
                className="pl-10 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
              />
            </div>
          </div>
        )}

        {/* Right Section */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mobile Time */}
          {isMobile && (
            <span className="text-sm font-bold text-foreground tabular-nums mr-2">
              {timeStr}
            </span>
          )}

          {/* Search button for tablet */}
          {isTablet && (
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Search className="h-4 w-4" />
            </Button>
          )}

          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-9 w-9 hover:bg-muted/50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative h-9 w-9 hover:bg-muted/50"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-4 min-w-4 sm:h-5 sm:min-w-5 p-0 flex items-center justify-center text-[9px] sm:text-[10px] bg-destructive border-2 border-background"
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

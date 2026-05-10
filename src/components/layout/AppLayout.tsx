import { ReactNode, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppSidebar } from './AppSidebar';
import { MobileNav } from './MobileNav';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { useDeviceType } from '@/hooks/useDeviceType';
import { Menu, RefreshCw, Search, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NavLink } from 'react-router-dom';
import { MacroPulseBar } from '@/components/dashboard/MacroPulseBar';
import { MarketTicker } from './MarketTicker';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isMobile, isTablet } = useDeviceType();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const timeStr = format(currentTime, 'HH:mm:ss');
  const dateStr = format(currentTime, "EEEE, d 'de' MMMM", { locale: ptBR });
  const capitalizedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  // Mobile and tablet layout - no sidebar, use sheet navigation
  if (isMobile || isTablet) {
    return (
      <div className="min-h-screen flex flex-col w-full bg-gradient-mesh">
        <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
        
        {/* Mobile/Tablet Header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setMobileNavOpen(true)}
                className="h-9 w-9"
              >
                <Menu className="h-5 w-5" />
              </Button>

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
              
              {!isMobile && (
                <div className="flex flex-col">
                  <span className="text-base font-bold text-foreground tabular-nums tracking-tight">
                    {timeStr}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                    {capitalizedDate}
                  </span>
                </div>
              )}

              <div className="live-indicator hidden sm:flex">
                <span className="text-xs font-semibold text-primary">LIVE</span>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {isMobile && (
                <span className="text-sm font-bold text-foreground tabular-nums mr-2">
                  {timeStr}
                </span>
              )}

              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Search className="h-4 w-4" />
              </Button>

              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-9 w-9"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </header>

        {/* Mobile Market Ticker */}
        <MarketTicker />

        {/* Mobile Macro Pulse Bar */}
        <MacroPulseBar />

        <motion.main 
          className="flex-1 p-3 sm:p-4 overflow-auto scrollbar-thin"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.main>
      </div>
    );
  }

  // Desktop layout - full sidebar with SidebarProvider
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-mesh">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 min-w-0">
          {/* Desktop Header */}
          <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
            <div className="flex items-center justify-between h-16 px-4 lg:px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger>
                  <Menu className="h-5 w-5" />
                </SidebarTrigger>
                
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-foreground tabular-nums tracking-tight">
                    {timeStr}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {capitalizedDate}
                  </span>
                </div>

                <div className="live-indicator">
                  <span className="text-xs font-semibold text-primary">LIVE</span>
                </div>
              </div>

              <div className="flex flex-1 max-w-md mx-8">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar ativos..."
                    className="pl-10 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="h-9 w-9 hover:bg-muted/50"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </header>

          {/* Desktop Market Ticker */}
          <MarketTicker />

          {/* Desktop Macro Pulse Bar */}
          <MacroPulseBar />

          <motion.main 
            className="flex-1 p-4 lg:p-6 overflow-auto scrollbar-thin"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

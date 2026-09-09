import { ReactNode, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';
import { CoffeeCandleMark, Wordmark } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { navDestinations } from './navDestinations';
import { SearchCommand } from './SearchCommand';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const isActive = (url: string) => (url === '/' ? pathname === '/' : pathname.startsWith(url));

  return (
    <div className="min-h-screen w-full bg-background">
      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Desktop icon rail */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-16 flex-col items-center gap-1 border-r border-border bg-card py-4">
        <NavLink to="/" className="mb-4">
          <CoffeeCandleMark className="h-7 w-7 text-brand" />
        </NavLink>
        {navDestinations.map((d) => (
          <Tooltip key={d.url} delayDuration={120}>
            <TooltipTrigger asChild>
              <NavLink
                to={d.url}
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-150',
                  isActive(d.url)
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <d.icon className="h-5 w-5" />
                <span className="sr-only">{d.title}</span>
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">{d.title}</TooltipContent>
          </Tooltip>
        ))}
      </aside>

      <div className="md:pl-16">
        {/* Minimal header */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-[720px] items-center justify-between px-4">
            <NavLink to="/" className="flex items-center gap-2">
              <CoffeeCandleMark className="h-6 w-6 text-brand md:hidden" />
              <Wordmark className="text-[15px]" />
            </NavLink>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setSearchOpen(true)}
                aria-label="Buscar"
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Alertas">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <motion.main
          className="mx-auto w-full max-w-[720px] px-4 pb-24 pt-4 md:pb-10"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.main>
      </div>

      {/* Mobile bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-xl md:hidden">
        <div className="flex items-stretch justify-around">
          {navDestinations.map((d) => (
            <NavLink
              key={d.url}
              to={d.url}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] transition-colors duration-150',
                isActive(d.url) ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <d.icon className="h-5 w-5" />
              {d.title}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

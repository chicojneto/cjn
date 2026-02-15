import { Coffee, LayoutDashboard, Newspaper, Calendar, BookOpen, TrendingUp, ClipboardCheck, BarChart3, Settings, Map, X } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mainNavItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Mercados', url: '/mercados', icon: BarChart3 },
  { title: 'Notícias', url: '/noticias', icon: Newspaper },
  { title: 'Calendário', url: '/calendario', icon: Calendar },
];

const analysisNavItems = [
  { title: 'Mapa Macro', url: '/mapa-macro', icon: Map },
  { title: 'Check List', url: '/checklist', icon: ClipboardCheck },
  { title: 'Estratégias', url: '/estrategias', icon: BookOpen },
  { title: 'Long/Short', url: '/longshort', icon: TrendingUp },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 }
};

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const handleNavClick = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 bg-sidebar border-sidebar-border">
        <SheetHeader className="border-b border-sidebar-border p-4">
          <div className="flex items-center justify-between">
            <NavLink to="/" className="flex items-center gap-3" onClick={handleNavClick}>
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-lg">
                  <Coffee className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border-2 border-sidebar animate-pulse" />
              </div>
              <div className="flex flex-col">
                <SheetTitle className="text-sm font-bold text-sidebar-foreground text-left">
                  PullBack<span className="text-accent">Com</span>Café
                </SheetTitle>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Portal de Investimentos
                </span>
              </div>
            </NavLink>
          </div>
        </SheetHeader>

        <motion.nav 
          className="flex-1 p-4 space-y-6 overflow-y-auto"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Principal */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-3 font-semibold">
              Principal
            </span>
            <div className="space-y-1">
              {mainNavItems.map((navItem) => (
                <motion.div key={navItem.title} variants={item}>
                  <NavLink
                    to={navItem.url}
                    onClick={handleNavClick}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                      isActive(navItem.url)
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <navItem.icon className="h-5 w-5 shrink-0" />
                    <span className="font-medium">{navItem.title}</span>
                  </NavLink>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Análises */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-3 font-semibold">
              Análises
            </span>
            <div className="space-y-1">
              {analysisNavItems.map((navItem) => (
                <motion.div key={navItem.title} variants={item}>
                  <NavLink
                    to={navItem.url}
                    onClick={handleNavClick}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                      isActive(navItem.url)
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <navItem.icon className="h-5 w-5 shrink-0" />
                    <span className="font-medium">{navItem.title}</span>
                  </NavLink>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Configurações */}
          <div className="pt-4 border-t border-sidebar-border">
            <motion.div variants={item}>
              <NavLink
                to="/configuracoes"
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                  isActive('/configuracoes')
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Settings className="h-5 w-5 shrink-0" />
                <span className="font-medium">Configurações</span>
              </NavLink>
            </motion.div>
          </div>
        </motion.nav>
      </SheetContent>
    </Sheet>
  );
}

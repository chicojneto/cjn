import { LayoutDashboard, Calendar, BookOpen, TrendingUp, ClipboardCheck, BarChart3, Settings, Globe2, NotebookPen, Radar, X } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { CoffeeCandleMark, Wordmark } from '@/components/brand/Logo';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mainNavItems = [
  { title: 'Mapa Global', url: '/', icon: Globe2 },
  { title: 'Cenário Macro', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Mercados', url: '/mercados', icon: BarChart3 },
  { title: 'Calendário', url: '/calendario', icon: Calendar },
];

const analysisNavItems = [
  { title: 'Check List', url: '/checklist', icon: ClipboardCheck },
  { title: 'Pré-Market', url: '/pre-market', icon: Radar },
  { title: 'Referência', url: '/referencia', icon: NotebookPen },
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
              <CoffeeCandleMark className="h-7 w-7 text-brand shrink-0" />
              <div className="flex flex-col">
                <SheetTitle className="text-left text-[17px] font-medium">
                  <Wordmark />
                </SheetTitle>
                <span className="text-xs text-muted-foreground">
                  Macro e pré-market
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

import { Coffee, Activity, Newspaper, Calendar, BookOpen, TrendingUp, ClipboardCheck, BarChart3, Settings } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const mainNavItems = [
  { title: 'Cenário Macro', url: '/', icon: Activity },
  { title: 'Mercados', url: '/mercados', icon: BarChart3 },
  { title: 'Notícias', url: '/noticias', icon: Newspaper },
  { title: 'Calendário', url: '/calendario', icon: Calendar },
];

const analysisNavItems = [
  { title: 'Check List', url: '/checklist', icon: ClipboardCheck },
  { title: 'Estratégias', url: '/estrategias', icon: BookOpen },
  { title: 'Long/Short', url: '/longshort', icon: TrendingUp },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar 
      className="border-r border-sidebar-border bg-sidebar"
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-lg group-hover:shadow-glow-accent transition-all duration-300">
              <Coffee className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border-2 border-sidebar animate-pulse" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-foreground">
                PullBack<span className="text-accent">Com</span>Café
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                Portal de Investimentos
              </span>
            </div>
          )}
        </NavLink>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 mb-2">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink 
                      to={item.url}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                        isActive(item.url) 
                          ? "bg-primary/15 text-primary border border-primary/30" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="font-medium text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 mb-2">
            Análises
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analysisNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink 
                      to={item.url}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                        isActive(item.url) 
                          ? "bg-primary/15 text-primary border border-primary/30" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="font-medium text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild
              tooltip="Configurações"
            >
              <NavLink 
                to="/configuracoes"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
              >
                <Settings className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="font-medium text-sm">Configurações</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

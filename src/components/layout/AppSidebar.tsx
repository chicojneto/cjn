import { Coffee, Activity, Calendar, BookOpen, TrendingUp, Tv, BarChart3, Settings, Globe2, NotebookPen, Radar } from 'lucide-react';
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
  { title: 'Mapa Global', url: '/', icon: Globe2 },
  { title: 'Cenário Macro', url: '/dashboard', icon: Activity },
  { title: 'Mercados', url: '/mercados', icon: BarChart3 },
  { title: 'Calendário', url: '/calendario', icon: Calendar },
];

const analysisNavItems = [
  { title: 'Modo TV', url: '/checklist', icon: Tv },
  { title: 'Pré-Market', url: '/pre-market', icon: Radar },
  { title: 'Playbook', url: '/playbook', icon: NotebookPen },
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
          <CoffeeCandleMark className="h-7 w-7 text-brand shrink-0" />
          {!collapsed && (
            <div className="flex flex-col">
              <Wordmark className="text-[17px]" />
              <span className="text-xs text-muted-foreground">
                Macro e pré-market
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
                    className="hover:bg-transparent hover:text-inherit data-[active=true]:bg-transparent data-[active=true]:text-inherit"
                  >
                    <NavLink
                      to={item.url}
                      end
                      onClick={(e) => e.currentTarget.blur()}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                        isActive(item.url)
                          ? "bg-primary/15 text-primary border border-primary/30"
                          : "text-muted-foreground md:hover:text-foreground md:hover:bg-muted/50"
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
                    className="hover:bg-transparent hover:text-inherit data-[active=true]:bg-transparent data-[active=true]:text-inherit"
                  >
                    <NavLink
                      to={item.url}
                      end
                      onClick={(e) => e.currentTarget.blur()}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                        isActive(item.url)
                          ? "bg-primary/15 text-primary border border-primary/30"
                          : "text-muted-foreground md:hover:text-foreground md:hover:bg-muted/50"
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

import { useAlerts } from '@/hooks/useAlerts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Check, AlertTriangle, Info, Zap, Newspaper, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AlertsPanelProps {
  compact?: boolean;
}

const priorityConfig = {
  urgent: { 
    color: 'bg-destructive/20 text-destructive border-destructive/30', 
    icon: AlertTriangle,
    label: 'URGENTE'
  },
  high: { 
    color: 'bg-warning/20 text-warning border-warning/30', 
    icon: Zap,
    label: 'ALTA'
  },
  medium: { 
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', 
    icon: Info,
    label: 'MÉDIA'
  },
  low: { 
    color: 'bg-muted text-muted-foreground border-muted', 
    icon: Info,
    label: 'BAIXA'
  },
};

const typeIcons = {
  news: Newspaper,
  event: Calendar,
  indicator: Zap,
  custom: Bell,
};

export function AlertsPanel({ compact = false }: AlertsPanelProps) {
  const { data: alerts, isLoading, markAsRead } = useAlerts();

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const unreadAlerts = alerts?.filter(a => !a.is_read) || [];
  const displayAlerts = compact ? alerts?.slice(0, 5) : alerts;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Alertas
          {unreadAlerts.length > 0 && (
            <Badge variant="destructive" className="text-xs font-mono">
              {unreadAlerts.length} novos
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!displayAlerts?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhum alerta</p>
          </div>
        ) : (
          <ScrollArea className={compact ? 'h-[350px]' : 'h-[600px]'}>
            <div className="space-y-3 pr-4">
              {displayAlerts.map((alert) => {
                const priority = priorityConfig[alert.priority];
                const PriorityIcon = priority.icon;
                const TypeIcon = typeIcons[alert.alert_type];
                
                return (
                  <div
                    key={alert.id}
                    className={cn(
                      'p-3 rounded-lg border transition-all',
                      alert.is_read 
                        ? 'bg-secondary/20 border-border/30 opacity-60' 
                        : 'bg-secondary/40 border-border/50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'p-1.5 rounded-md shrink-0',
                        priority.color.split(' ')[0]
                      )}>
                        <PriorityIcon className={cn('h-4 w-4', priority.color.split(' ')[1])} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={cn('text-[9px]', priority.color)}>
                            {priority.label}
                          </Badge>
                          <TypeIcon className="h-3 w-3 text-muted-foreground" />
                          {alert.assets && (
                            <Badge variant="secondary" className="text-[9px] font-mono">
                              {alert.assets.symbol}
                            </Badge>
                          )}
                        </div>
                        
                        <h4 className="font-medium text-sm mb-1 line-clamp-1">
                          {alert.title}
                        </h4>
                        
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {alert.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(alert.created_at), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </span>
                          
                          {!alert.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => markAsRead(alert.id)}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Marcar lido
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
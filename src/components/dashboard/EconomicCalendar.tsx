import { useEconomicEvents } from '@/hooks/useEconomicEvents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar as CalendarIcon, Clock, Globe, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, isTomorrow, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const impactColors = {
  high: 'bg-destructive/20 text-destructive border-destructive/30',
  medium: 'bg-warning/20 text-warning border-warning/30',
  low: 'bg-muted text-muted-foreground border-muted',
};

const countryFlags: Record<string, string> = {
  'US': '🇺🇸',
  'USA': '🇺🇸',
  'EU': '🇪🇺',
  'EUR': '🇪🇺',
  'UK': '🇬🇧',
  'GBP': '🇬🇧',
  'JP': '🇯🇵',
  'JPY': '🇯🇵',
  'CA': '🇨🇦',
  'CAD': '🇨🇦',
  'BR': '🇧🇷',
  'BRL': '🇧🇷',
  'CN': '🇨🇳',
  'CNY': '🇨🇳',
};

export function EconomicCalendar() {
  const { data: events, isLoading } = useEconomicEvents(14);

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendário Econômico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group events by date
  const groupedEvents = events?.reduce((acc, event) => {
    const dateKey = startOfDay(new Date(event.event_date)).toISOString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

  const sortedDates = Object.keys(groupedEvents || {}).sort();

  if (!events?.length) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendário Econômico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum evento programado</p>
            <p className="text-sm mt-1">Os eventos econômicos aparecerão aqui</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Calendário Econômico
          <Badge variant="secondary" className="text-xs font-mono ml-auto">
            {events.length} eventos
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-6 pr-4">
            {sortedDates.map((dateKey) => {
              const date = new Date(dateKey);
              const dayEvents = groupedEvents![dateKey];
              
              let dateLabel = format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
              if (isToday(date)) dateLabel = 'Hoje - ' + dateLabel;
              if (isTomorrow(date)) dateLabel = 'Amanhã - ' + dateLabel;
              
              return (
                <div key={dateKey}>
                  <h3 className="text-sm font-semibold text-primary mb-3 sticky top-0 bg-card/80 backdrop-blur-sm py-2 border-b border-border/50">
                    {dateLabel}
                  </h3>
                  
                  <div className="space-y-3">
                    {dayEvents?.map((event) => (
                      <div 
                        key={event.id}
                        className="p-4 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-center shrink-0">
                            <span className="text-lg">
                              {event.country ? countryFlags[event.country] || '🌐' : '🌐'}
                            </span>
                            <p className="text-xs font-mono text-muted-foreground mt-1">
                              {format(new Date(event.event_date), 'HH:mm')}
                            </p>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              {event.impact && (
                                <Badge 
                                  variant="outline" 
                                  className={cn('text-[10px]', impactColors[event.impact])}
                                >
                                  {event.impact.toUpperCase()}
                                </Badge>
                              )}
                              {event.indicators && (
                                <Badge variant="secondary" className="text-[10px]">
                                  {event.indicators.category}
                                </Badge>
                              )}
                            </div>
                            
                            <h4 className="font-medium text-sm mb-1">{event.title}</h4>
                            
                            {event.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                {event.description}
                              </p>
                            )}
                            
                            {(event.previous_value || event.forecast_value || event.actual_value) && (
                              <div className="flex items-center gap-4 text-xs font-mono">
                                {event.previous_value && (
                                  <div>
                                    <span className="text-muted-foreground">Anterior: </span>
                                    <span>{event.previous_value}</span>
                                  </div>
                                )}
                                {event.forecast_value && (
                                  <div>
                                    <span className="text-muted-foreground">Previsão: </span>
                                    <span className="text-warning">{event.forecast_value}</span>
                                  </div>
                                )}
                                {event.actual_value && (
                                  <div>
                                    <span className="text-muted-foreground">Atual: </span>
                                    <span className="text-primary font-bold">{event.actual_value}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
import { useDailyCorrelations } from '@/hooks/useDailyCorrelations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, Calendar, Zap, AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyCorrelationsCardProps {
  compact?: boolean;
}

const impactConfig = {
  bullish: { 
    icon: TrendingUp, 
    color: 'text-success', 
    bg: 'bg-success/20',
    label: 'ALTA',
    borderColor: 'border-success/50'
  },
  bearish: { 
    icon: TrendingDown, 
    color: 'text-destructive', 
    bg: 'bg-destructive/20',
    label: 'BAIXA',
    borderColor: 'border-destructive/50'
  },
  neutral: { 
    icon: Minus, 
    color: 'text-muted-foreground', 
    bg: 'bg-muted',
    label: 'NEUTRO',
    borderColor: 'border-border'
  },
};

const strengthConfig = {
  high: { label: 'Alto Impacto', color: 'bg-destructive/20 text-destructive' },
  medium: { label: 'Médio Impacto', color: 'bg-warning/20 text-warning' },
  low: { label: 'Baixo Impacto', color: 'bg-muted text-muted-foreground' },
};

export function DailyCorrelationsCard({ compact = false }: DailyCorrelationsCardProps) {
  const { data, isLoading, error } = useDailyCorrelations();

  if (isLoading) {
    return (
      <Card className="border-border/30 bg-card/50">
        <CardHeader className="py-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Análise do Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-border/30 bg-card/50">
        <CardHeader className="py-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Análise do Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Não foi possível carregar a análise</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/30 bg-card/50">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Análise do Dia
          </CardTitle>
          <div className="flex items-center gap-2">
            {data.highImpactCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                {data.highImpactCount} Alto Impacto
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              {data.eventsCount} eventos
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Asset Correlations */}
        <div className={cn("grid gap-3", compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3")}>
          {data.correlations.map((correlation) => {
            const config = impactConfig[correlation.impact];
            const Icon = config.icon;
            
            return (
              <div 
                key={correlation.asset}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all hover:shadow-md",
                  config.bg,
                  config.borderColor
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-5 w-5", config.color)} />
                    <span className="font-bold">{correlation.assetName}</span>
                  </div>
                  <Badge className={cn("text-xs font-bold", config.bg, config.color)}>
                    {config.label}
                  </Badge>
                </div>
                
                <p className="text-xs font-mono text-muted-foreground mb-2">
                  {correlation.asset}
                </p>
                
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className={cn("text-[10px]", strengthConfig[correlation.strength].color)}>
                    {strengthConfig[correlation.strength].label}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {correlation.events.length} evento{correlation.events.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {correlation.ruleBasedReason}
                </p>
                
                {!compact && correlation.events.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-[10px] text-muted-foreground mb-1">Eventos relevantes:</p>
                    <div className="space-y-1">
                      {correlation.events.slice(0, 2).map((event, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[10px]">
                          <span className="text-muted-foreground">{event.time}</span>
                          <span className="truncate">{event.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* AI Analysis */}
        {data.aiAnalysis && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Análise IA</span>
            </div>
            <p className="text-sm text-foreground/90 whitespace-pre-line">
              {data.aiAnalysis}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

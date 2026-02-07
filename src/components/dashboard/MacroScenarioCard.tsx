import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle, AlertTriangle, Info, Zap } from 'lucide-react';
import { useMarketCorrelations } from '@/hooks/useMarketCorrelations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ScenarioSignal {
  label: string;
  status: 'bullish' | 'bearish' | 'neutral';
  description: string;
}

interface DailyScenario {
  title: string;
  sentiment: 'risk-on' | 'risk-off' | 'neutral';
  keyPoints: string[];
  signals: ScenarioSignal[];
}

function getStatusIcon(status: 'bullish' | 'bearish' | 'neutral') {
  switch (status) {
    case 'bullish':
      return <CheckCircle className="h-4 w-4 text-success" />;
    case 'bearish':
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-warning" />;
  }
}

function getStatusColor(status: 'bullish' | 'bearish' | 'neutral') {
  switch (status) {
    case 'bullish':
      return 'bg-success/10 border-success/30 text-success';
    case 'bearish':
      return 'bg-destructive/10 border-destructive/30 text-destructive';
    default:
      return 'bg-warning/10 border-warning/30 text-warning';
  }
}

function generateDailyScenario(data: ReturnType<typeof useMarketCorrelations>['data']): DailyScenario {
  if (!data) {
    return {
      title: 'Aguardando dados do mercado...',
      sentiment: 'neutral',
      keyPoints: ['Carregando indicadores macro...'],
      signals: [],
    };
  }

  const keyPoints: string[] = [];
  const signals: ScenarioSignal[] = [];
  let bullishScore = 0;
  let bearishScore = 0;

  // DXY Analysis
  if (data.dxy) {
    const dxyStrong = data.dxy.changePercent > 0.3;
    const dxyWeak = data.dxy.changePercent < -0.3;
    
    if (dxyStrong) {
      keyPoints.push(`Dólar forte (DXY ${data.dxy.changePercent > 0 ? '+' : ''}${data.dxy.changePercent.toFixed(2)}%) pressiona commodities e emergentes`);
      bearishScore += 2;
    } else if (dxyWeak) {
      keyPoints.push(`Dólar em queda (DXY ${data.dxy.changePercent.toFixed(2)}%) favorece ativos de risco`);
      bullishScore += 2;
    }
    
    signals.push({
      label: 'DXY',
      status: dxyStrong ? 'bearish' : dxyWeak ? 'bullish' : 'neutral',
      description: `${data.dxy.price.toFixed(2)} (${data.dxy.changePercent > 0 ? '+' : ''}${data.dxy.changePercent.toFixed(2)}%)`,
    });
  }

  // VIX Analysis
  if (data.vix) {
    const vixHigh = data.vix.price > 20;
    const vixLow = data.vix.price < 15;
    const vixSpike = data.vix.changePercent > 10;
    const vixDrop = data.vix.changePercent < -10;
    
    if (vixSpike) {
      keyPoints.push(`VIX dispara ${data.vix.changePercent.toFixed(1)}% - mercado precifica risco elevado`);
      bearishScore += 3;
    } else if (vixDrop) {
      keyPoints.push(`VIX em queda acentuada - volatilidade controlada`);
      bullishScore += 2;
    } else if (vixHigh) {
      keyPoints.push(`VIX elevado em ${data.vix.price.toFixed(1)} indica cautela no mercado`);
      bearishScore += 1;
    } else if (vixLow) {
      keyPoints.push(`VIX baixo em ${data.vix.price.toFixed(1)} sugere complacência`);
      bullishScore += 1;
    }
    
    signals.push({
      label: 'VIX',
      status: vixHigh || vixSpike ? 'bearish' : vixLow ? 'bullish' : 'neutral',
      description: `${data.vix.price.toFixed(2)} (${data.vix.changePercent > 0 ? '+' : ''}${data.vix.changePercent.toFixed(2)}%)`,
    });
  }

  // US 10Y Yields
  if (data.us10y) {
    const yieldHigh = data.us10y.price > 4.5;
    const yieldRising = data.us10y.changePercent > 1;
    const yieldFalling = data.us10y.changePercent < -1;
    
    if (yieldRising) {
      keyPoints.push(`Yields dos Treasuries em alta - pressão sobre growth stocks`);
      bearishScore += 1;
    } else if (yieldFalling) {
      keyPoints.push(`Queda nos yields favorece ativos de duration longa`);
      bullishScore += 1;
    }
    
    signals.push({
      label: 'US10Y',
      status: yieldHigh || yieldRising ? 'bearish' : yieldFalling ? 'bullish' : 'neutral',
      description: `${data.us10y.price.toFixed(2)}% (${data.us10y.changePercent > 0 ? '+' : ''}${(data.us10y.change * 100).toFixed(0)}bps)`,
    });
  }

  // S&P 500 Futures
  if (data.sp500Futures) {
    const futuresUp = data.sp500Futures.changePercent > 0.5;
    const futuresDown = data.sp500Futures.changePercent < -0.5;
    
    if (futuresUp) {
      bullishScore += 2;
    } else if (futuresDown) {
      bearishScore += 2;
    }
    
    signals.push({
      label: 'ES1!',
      status: futuresUp ? 'bullish' : futuresDown ? 'bearish' : 'neutral',
      description: `${data.sp500Futures.price.toFixed(0)} (${data.sp500Futures.changePercent > 0 ? '+' : ''}${data.sp500Futures.changePercent.toFixed(2)}%)`,
    });
  }

  // Gold
  if (data.gold) {
    const goldUp = data.gold.changePercent > 0.5;
    const goldDown = data.gold.changePercent < -0.5;
    
    if (goldUp && data.vix && data.vix.price > 18) {
      keyPoints.push(`Ouro em alta com VIX elevado - busca por proteção`);
    }
    
    signals.push({
      label: 'XAU',
      status: goldUp ? 'bullish' : goldDown ? 'bearish' : 'neutral',
      description: `$${data.gold.price.toFixed(2)} (${data.gold.changePercent > 0 ? '+' : ''}${data.gold.changePercent.toFixed(2)}%)`,
    });
  }

  // Determine overall sentiment
  const netScore = bullishScore - bearishScore;
  let sentiment: 'risk-on' | 'risk-off' | 'neutral' = 'neutral';
  let title = 'Mercado em modo de consolidação';

  if (netScore >= 3) {
    sentiment = 'risk-on';
    title = 'Cenário favorável para ativos de risco';
  } else if (netScore <= -3) {
    sentiment = 'risk-off';
    title = 'Mercado em modo de aversão ao risco';
  } else if (netScore >= 1) {
    title = 'Viés levemente otimista no mercado';
  } else if (netScore <= -1) {
    title = 'Viés de cautela nos mercados';
  }

  // Add time-based context
  const hour = new Date().getHours();
  if (hour >= 10 && hour < 11) {
    keyPoints.push('📍 Abertura do mercado americano em breve');
  } else if (hour >= 4 && hour < 6) {
    keyPoints.push('📍 Sessão europeia ativa - atenção aos dados da zona do euro');
  }

  // Ensure at least some key points
  if (keyPoints.length === 0) {
    keyPoints.push('Mercado operando sem grandes catalisadores');
    keyPoints.push('Monitorar fluxo institucional para definição de tendência');
  }

  return {
    title,
    sentiment,
    keyPoints: keyPoints.slice(0, 5),
    signals,
  };
}

export function MacroScenarioCard() {
  const { data, isLoading, error } = useMarketCorrelations();

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="h-5 w-5 text-muted-foreground" />
            Cenário Macro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aguardando dados do mercado para análise...
          </p>
        </CardContent>
      </Card>
    );
  }

  const scenario = generateDailyScenario(data);

  const sentimentConfig = {
    'risk-on': {
      color: 'bg-success/10 border-success/30',
      textColor: 'text-success',
      icon: TrendingUp,
      label: 'RISK-ON'
    },
    'risk-off': {
      color: 'bg-destructive/10 border-destructive/30',
      textColor: 'text-destructive',
      icon: TrendingDown,
      label: 'RISK-OFF'
    },
    neutral: {
      color: 'bg-warning/10 border-warning/30',
      textColor: 'text-warning',
      icon: Minus,
      label: 'NEUTRO'
    },
  };

  const sentimentStyle = sentimentConfig[scenario.sentiment];
  const SentimentIcon = sentimentStyle.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={cn(
        "border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden",
        "hover:border-border/70 transition-colors duration-300"
      )}>
        {/* Accent bar at top */}
        <div className={cn(
          "h-1",
          scenario.sentiment === 'risk-on' && "bg-gradient-to-r from-success/50 to-success/20",
          scenario.sentiment === 'risk-off' && "bg-gradient-to-r from-destructive/50 to-destructive/20",
          scenario.sentiment === 'neutral' && "bg-gradient-to-r from-warning/50 to-warning/20"
        )} />
        
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  Cenário Macro do Dia
                </span>
              </div>
              <CardTitle className="text-xl font-bold tracking-tight">
                {scenario.title}
              </CardTitle>
            </div>
            <div className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border font-mono text-sm font-bold",
              sentimentStyle.color,
              sentimentStyle.textColor
            )}>
              <SentimentIcon className="h-4 w-4" />
              {sentimentStyle.label}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Key Points */}
          <div className="space-y-2">
            {scenario.keyPoints.map((point, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-2"
              >
                <span className="text-primary mt-1">•</span>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {point}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Signals Grid */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
            {scenario.signals.map((signal, idx) => (
              <motion.div
                key={signal.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + idx * 0.05 }}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg border",
                  getStatusColor(signal.status)
                )}
              >
                {getStatusIcon(signal.status)}
                <span className="text-xs font-mono font-bold">{signal.label}</span>
                <span className="text-xs font-mono opacity-80">{signal.description}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

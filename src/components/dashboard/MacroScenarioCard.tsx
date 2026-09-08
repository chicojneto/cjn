import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle, AlertTriangle, Info, Zap } from 'lucide-react';
import { useMarketCorrelations } from '@/hooks/useMarketCorrelations';
import { useRegimeDoDia } from '@/hooks/useRegimeDoDia';
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
  let carryTradeRisk: 'low' | 'medium' | 'high' = 'low';

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

  // USD/JPY & Carry Trade Analysis
  if (data.usdJpy) {
    // Variação só é utilizável se passou na verificação de sanidade
    const jpySuspicious = (data.usdJpy as any).isSuspicious === true
      || !Number.isFinite(data.usdJpy.changePercent);
    const yenStrengthening = !jpySuspicious && data.usdJpy.changePercent < -0.5; // USD/JPY falling = Yen strengthening
    const yenWeakening = !jpySuspicious && data.usdJpy.changePercent > 0.5;
    const severeYenStrength = !jpySuspicious && data.usdJpy.changePercent < -1.5;

    if (severeYenStrength) {
      keyPoints.push(`⚠️ ALERTA CARRY TRADE: Iene forte (${data.usdJpy.changePercent.toFixed(2)}%) - risco de unwinding em tech stocks`);
      bearishScore += 4;
      carryTradeRisk = 'high';
    } else if (yenStrengthening) {
      keyPoints.push(`Iene se fortalecendo (USD/JPY ${data.usdJpy.changePercent.toFixed(2)}%) - monitorar risco carry trade`);
      bearishScore += 2;
      carryTradeRisk = 'medium';
    } else if (yenWeakening) {
      keyPoints.push(`Iene enfraquecido favorece fluxo de carry trade para tech stocks`);
      bullishScore += 1;
    }

    signals.push({
      label: 'USD/JPY',
      status: yenStrengthening ? 'bearish' : yenWeakening ? 'bullish' : 'neutral',
      description: jpySuspicious
        ? `${data.usdJpy.price.toFixed(2)} (— dado suspeito)`
        : `${data.usdJpy.price.toFixed(2)} (${data.usdJpy.changePercent > 0 ? '+' : ''}${data.usdJpy.changePercent.toFixed(2)}%)`,
    });
  }

  // VIX Analysis
  if (data.vix) {
    const vixHigh = data.vix.price > 20;
    const vixLow = data.vix.price < 15;
    const vixSpike = data.vix.changePercent > 10;
    const vixDrop = data.vix.changePercent < -10;
    const vixExtreme = data.vix.price > 30;
    
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
    
    // Carry Trade + VIX compound risk
    if (carryTradeRisk === 'high' && vixHigh) {
      keyPoints.push(`🔴 Risco sistêmico: VIX alto + Iene forte = condições para liquidação em cascata`);
      bearishScore += 3;
    }
    
    signals.push({
      label: 'VIX',
      status: vixExtreme ? 'bearish' : vixHigh || vixSpike ? 'bearish' : vixLow ? 'bullish' : 'neutral',
      description: `${data.vix.price.toFixed(2)} (${data.vix.changePercent > 0 ? '+' : ''}${data.vix.changePercent.toFixed(2)}%)`,
    });
  }

  // US 10Y Yields - Important for Carry Trade differential
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
    
    // Carry trade context: High US yields maintain the differential
    if (yieldHigh && carryTradeRisk === 'low') {
      // High yield differential keeps carry trade attractive
      bullishScore += 1;
    }
    
    signals.push({
      label: 'US10Y',
      status: yieldHigh || yieldRising ? 'bearish' : yieldFalling ? 'bullish' : 'neutral',
      description: `${data.us10y.price.toFixed(2)}% (${data.us10y.changePercent > 0 ? '+' : ''}${(data.us10y.change * 100).toFixed(0)}bps)`,
    });
  }

  // S&P 500 Futures - Tech exposure indicator
  if (data.sp500Futures) {
    const futuresUp = data.sp500Futures.changePercent > 0.5;
    const futuresDown = data.sp500Futures.changePercent < -0.5;
    const severeDrop = data.sp500Futures.changePercent < -2;
    
    if (futuresUp) {
      bullishScore += 2;
    } else if (futuresDown) {
      bearishScore += 2;
    }
    
    // Compound carry trade risk assessment
    if (severeDrop && carryTradeRisk !== 'low') {
      keyPoints.push(`Futuros S&P em queda ${data.sp500Futures.changePercent.toFixed(2)}% com risco carry trade - possível margin call em curso`);
    }
    
    signals.push({
      label: 'ES1!',
      status: futuresUp ? 'bullish' : futuresDown ? 'bearish' : 'neutral',
      description: `${data.sp500Futures.price.toFixed(0)} (${data.sp500Futures.changePercent > 0 ? '+' : ''}${data.sp500Futures.changePercent.toFixed(2)}%)`,
    });
  }

  // Gold - Safe haven indicator
  if (data.gold) {
    const goldUp = data.gold.changePercent > 0.5;
    const goldDown = data.gold.changePercent < -0.5;
    
    if (goldUp && data.vix && data.vix.price > 18) {
      keyPoints.push(`Ouro em alta com VIX elevado - busca por proteção (flight to quality)`);
    }
    
    signals.push({
      label: 'XAU',
      status: goldUp ? 'bullish' : goldDown ? 'bearish' : 'neutral',
      description: `$${data.gold.price.toFixed(2)} (${data.gold.changePercent > 0 ? '+' : ''}${data.gold.changePercent.toFixed(2)}%)`,
    });
  }

  // Nikkei Analysis - Japanese market health indicator
  if (data.nikkei) {
    const nikkeiDown = data.nikkei.changePercent < -1;
    const nikkeiSevere = data.nikkei.changePercent < -3;
    
    if (nikkeiSevere) {
      keyPoints.push(`🇯🇵 Nikkei em queda severa (${data.nikkei.changePercent.toFixed(2)}%) - estresse no mercado japonês`);
      bearishScore += 3;
      if (carryTradeRisk !== 'low') {
        carryTradeRisk = 'high';
      }
    } else if (nikkeiDown && carryTradeRisk !== 'low') {
      keyPoints.push(`Nikkei pressionado junto com iene forte - observar contágio`);
      bearishScore += 1;
    }
    
    signals.push({
      label: 'NKY',
      status: nikkeiSevere ? 'bearish' : nikkeiDown ? 'bearish' : 'neutral',
      description: `${data.nikkei.price.toFixed(0)} (${data.nikkei.changePercent > 0 ? '+' : ''}${data.nikkei.changePercent.toFixed(2)}%)`,
    });
  }

  // Determine overall sentiment
  const netScore = bullishScore - bearishScore;
  let sentiment: 'risk-on' | 'risk-off' | 'neutral' = 'neutral';
  let title = 'Mercado em modo de consolidação';

  // Override sentiment if carry trade risk is high
  if (carryTradeRisk === 'high') {
    sentiment = 'risk-off';
    title = '⚠️ Alerta: Risco de unwinding do Carry Trade japonês';
  } else if (netScore >= 3) {
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
  } else if (hour >= 20 || hour < 2) {
    keyPoints.push('📍 Sessão asiática ativa - monitorar USD/JPY e Nikkei');
  }

  // Ensure at least some key points
  if (keyPoints.length === 0) {
    keyPoints.push('Mercado operando sem grandes catalisadores');
    keyPoints.push('Diferencial de juros EUA-Japão sustenta fluxo de carry trade');
  }

  // Add carry trade educational context when risk is present
  if (carryTradeRisk === 'medium') {
    keyPoints.push('💡 Carry Trade: Iene forte pode forçar liquidação de posições em tech');
  }

  return {
    title,
    sentiment,
    keyPoints: keyPoints.slice(0, 6),
    signals,
  };
}

export function MacroScenarioCard() {
  const { data, isLoading, error } = useMarketCorrelations();
  const { regime: dia } = useRegimeDoDia();

  if (isLoading) {
    return (
      <div className="border border-border/50 bg-background">
        <div className="py-2 px-3 border-b border-amber-500/50 bg-amber-500/20">
          <h3 className="text-sm font-mono flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider">
            <Zap className="h-4 w-4" />
            CENÁRIO MACRO DO DIA
          </h3>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-7 w-24" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="border border-border/50 bg-background">
        <div className="py-2 px-3 border-b border-amber-500/50 bg-amber-500/20">
          <h3 className="text-sm font-mono flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider">
            <Zap className="h-4 w-4" />
            CENÁRIO MACRO DO DIA
          </h3>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Info className="h-4 w-4" />
            <span className="text-sm font-mono">Aguardando dados do mercado para análise...</span>
          </div>
        </div>
      </div>
    );
  }

  const scenario = generateDailyScenario(data);
  const sentiment: 'risk-on' | 'risk-off' | 'neutral' =
    dia.regime === 'risk-on' ? 'risk-on' : dia.regime === 'risk-off' ? 'risk-off' : 'neutral';
  const titulo =
    dia.viesWIN === 'alta'
      ? 'Viés de ALTA para o WIN'
      : dia.viesWIN === 'baixa'
      ? 'Viés de BAIXA para o WIN'
      : 'Viés NEUTRO para o WIN';

  const sentimentConfig = {
    'risk-on': {
      bg: 'bg-emerald-500/20 border-emerald-500/50',
      text: 'text-emerald-400',
      icon: TrendingUp,
      label: 'RISK-ON'
    },
    'risk-off': {
      bg: 'bg-red-500/20 border-red-500/50',
      text: 'text-red-400',
      icon: TrendingDown,
      label: 'RISK-OFF'
    },
    neutral: {
      bg: 'bg-yellow-500/20 border-yellow-500/50',
      text: 'text-yellow-400',
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
      <div className="border border-border/50 bg-background">
        {/* Terminal-style header */}
        <div className="py-2 px-3 border-b border-amber-500/50 bg-amber-500/20">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider">
              <Zap className="h-4 w-4" />
              CENÁRIO MACRO DO DIA
            </h3>
            <div className={cn(
              "flex items-center gap-2 px-2 py-1 border font-mono text-xs font-bold",
              sentimentStyle.bg,
              sentimentStyle.text
            )}>
              <SentimentIcon className="h-3 w-3" />
              {sentimentStyle.label}
            </div>
          </div>
        </div>

        <div className="p-0">
          {/* Title Section */}
          <div className="px-3 py-3 border-b border-border/30 bg-card/30">
            <h4 className="text-base font-bold text-foreground">
              {scenario.title}
            </h4>
          </div>

          {/* Key Points */}
          <div className="px-3 py-2 border-b border-border/30">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              📋 PONTOS-CHAVE
            </div>
            <div className="space-y-1.5">
              {scenario.keyPoints.map((point, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-start gap-2"
                >
                  <span className="text-amber-400 mt-0.5 text-xs">•</span>
                  <p className="text-xs text-foreground/90 leading-relaxed font-mono">
                    {point}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Signals Grid */}
          <div className="px-3 py-2 bg-card/20">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              📊 INDICADORES
            </div>
            <div className="flex flex-wrap gap-1.5">
              {scenario.signals.map((signal, idx) => (
                <motion.div
                  key={signal.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + idx * 0.03 }}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 border",
                    getStatusColor(signal.status)
                  )}
                >
                  {getStatusIcon(signal.status)}
                  <span className="text-[10px] font-mono font-bold">{signal.label}</span>
                  <span className="text-[10px] font-mono opacity-80">{signal.description}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

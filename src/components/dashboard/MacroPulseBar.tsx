import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Activity, Globe, AlertTriangle, Clock } from 'lucide-react';
import { useMarketCorrelations } from '@/hooks/useMarketCorrelations';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface PulseIndicatorProps {
  label: string;
  value: string;
  change?: string;
  changeValue?: number;
  alertLevel?: 'low' | 'medium' | 'high';
  compact?: boolean;
}

function PulseIndicator({ label, value, change, changeValue = 0, alertLevel, compact }: PulseIndicatorProps) {
  const isPositive = changeValue > 0;
  const isNegative = changeValue < 0;

  const alertColors = {
    low: 'text-success',
    medium: 'text-warning',
    high: 'text-destructive',
  };

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/50 border border-border/30",
      compact ? "px-2 py-1" : ""
    )}>
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span className={cn(
        "font-mono font-bold tabular-nums",
        compact ? "text-sm" : "text-base",
        alertLevel ? alertColors[alertLevel] : "text-foreground"
      )}>
        {value}
      </span>
      {change && (
        <span className={cn(
          "font-mono text-xs font-semibold tabular-nums",
          isPositive && "text-success",
          isNegative && "text-destructive",
          !isPositive && !isNegative && "text-muted-foreground"
        )}>
          {isPositive && <TrendingUp className="inline h-3 w-3 mr-0.5" />}
          {isNegative && <TrendingDown className="inline h-3 w-3 mr-0.5" />}
          {!isPositive && !isNegative && <Minus className="inline h-3 w-3 mr-0.5" />}
          {change}
        </span>
      )}
    </div>
  );
}

function WinBiasBadge({ vies }: { vies: ViesWIN }) {
  const config = {
    alta: {
      label: 'ALTA',
      color: 'text-success bg-success/10 border-success/30',
      icon: TrendingUp,
    },
    baixa: {
      label: 'BAIXA',
      color: 'text-destructive bg-destructive/10 border-destructive/30',
      icon: TrendingDown,
    },
    neutro: {
      label: 'NEUTRO',
      color: 'text-warning bg-warning/10 border-warning/30',
      icon: Minus,
    },
  } as const;

  const { label, color, icon: Icon } = config[vies];

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-xs font-bold",
      color
    )}>
      <Icon className="h-3.5 w-3.5" />
      WIN {label}
    </div>
  );
}


function SessionIndicator() {
  const hour = new Date().getHours();
  
  // Session times (approximate UTC-3 for Brazil)
  // Asia: 20:00 - 05:00
  // Europe: 04:00 - 12:00
  // USA: 10:30 - 18:00
  
  let session: { name: string; flag: string; active: boolean }[] = [];
  
  if (hour >= 20 || hour < 5) {
    session = [
      { name: 'ÁSIA', flag: '🌏', active: true },
      { name: 'EUR', flag: '🇪🇺', active: false },
      { name: 'EUA', flag: '🇺🇸', active: false },
    ];
  } else if (hour >= 4 && hour < 10) {
    session = [
      { name: 'ÁSIA', flag: '🌏', active: hour < 5 },
      { name: 'EUR', flag: '🇪🇺', active: true },
      { name: 'EUA', flag: '🇺🇸', active: false },
    ];
  } else if (hour >= 10 && hour < 18) {
    session = [
      { name: 'ÁSIA', flag: '🌏', active: false },
      { name: 'EUR', flag: '🇪🇺', active: hour < 13 },
      { name: 'EUA', flag: '🇺🇸', active: true },
    ];
  } else {
    session = [
      { name: 'ÁSIA', flag: '🌏', active: false },
      { name: 'EUR', flag: '🇪🇺', active: false },
      { name: 'EUA', flag: '🇺🇸', active: false },
    ];
  }

  return (
    <div className="flex items-center gap-1">
      <Globe className="h-3.5 w-3.5 text-muted-foreground mr-1" />
      {session.map((s) => (
        <span 
          key={s.name}
          className={cn(
            "text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded",
            s.active 
              ? "bg-primary/20 text-primary border border-primary/30" 
              : "text-muted-foreground"
          )}
        >
          {s.flag}
        </span>
      ))}
    </div>
  );
}

function getVixLevel(vix: number): 'low' | 'medium' | 'high' {
  if (vix < 15) return 'low';
  if (vix < 25) return 'medium';
  return 'high';
}

function getRiskSentiment(data: ReturnType<typeof useMarketCorrelations>['data']): 'risk-on' | 'risk-off' | 'neutral' {
  if (!data) return 'neutral';
  
  let score = 0;
  
  // VIX analysis
  if (data.vix) {
    if (data.vix.price < 15) score += 2;
    else if (data.vix.price > 25) score -= 2;
    if (data.vix.changePercent < -5) score += 1;
    else if (data.vix.changePercent > 5) score -= 1;
  }
  
  // DXY analysis (strong dollar = risk-off)
  if (data.dxy) {
    if (data.dxy.changePercent > 0.5) score -= 1;
    else if (data.dxy.changePercent < -0.5) score += 1;
  }
  
  // US 10Y Yields
  if (data.us10y) {
    if (data.us10y.changePercent > 2) score -= 1;
    else if (data.us10y.changePercent < -2) score += 1;
  }
  
  // S&P 500 Futures
  if (data.sp500Futures) {
    if (data.sp500Futures.changePercent > 0.5) score += 1;
    else if (data.sp500Futures.changePercent < -0.5) score -= 1;
  }
  
  if (score >= 2) return 'risk-on';
  if (score <= -2) return 'risk-off';
  return 'neutral';
}

export function MacroPulseBar() {
  const { data, isLoading } = useMarketCorrelations();

  if (isLoading) {
    return (
      <div className="w-full bg-card/30 backdrop-blur-sm border-b border-border/30 px-4 py-2">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    );
  }

  const riskSentiment = getRiskSentiment(data);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-card/30 backdrop-blur-sm border-b border-border/30 px-4 py-2"
    >
      <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
        {/* DXY */}
        {data?.dxy && (
          <PulseIndicator
            label="DXY"
            value={data.dxy.price.toFixed(2)}
            change={`${data.dxy.isPositive ? '+' : ''}${data.dxy.changePercent.toFixed(2)}%`}
            changeValue={data.dxy.changePercent}
            compact
          />
        )}
        
        {/* VIX */}
        {data?.vix && (
          <PulseIndicator
            label="VIX"
            value={data.vix.price.toFixed(2)}
            change={`${data.vix.isPositive ? '+' : ''}${data.vix.changePercent.toFixed(2)}%`}
            changeValue={data.vix.changePercent}
            alertLevel={getVixLevel(data.vix.price)}
            compact
          />
        )}
        
        {/* US 10Y */}
        {data?.us10y && (
          <PulseIndicator
            label="US10Y"
            value={`${data.us10y.price.toFixed(2)}%`}
            change={`${data.us10y.change > 0 ? '+' : ''}${(data.us10y.change * 100).toFixed(0)}bps`}
            changeValue={data.us10y.change}
            compact
          />
        )}
        
        <div className="h-6 w-px bg-border/50 mx-1" />
        
        {/* Risk Sentiment */}
        <RiskSentiment sentiment={riskSentiment} />
        
        <div className="h-6 w-px bg-border/50 mx-1" />
        
        {/* Session */}
        <SessionIndicator />
        
        {/* Live indicator */}
        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Activity className="h-3 w-3 text-primary animate-pulse" />
          <span className="font-mono">LIVE</span>
        </div>
      </div>
    </motion.div>
  );
}

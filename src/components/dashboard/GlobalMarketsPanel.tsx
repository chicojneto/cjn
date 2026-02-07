import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Globe, Clock } from 'lucide-react';
import { useMarketCorrelations } from '@/hooks/useMarketCorrelations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface MarketItemProps {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  isPositive: boolean;
}

function MarketItem({ symbol, name, price, changePercent, isPositive }: MarketItemProps) {
  const Icon = isPositive ? TrendingUp : changePercent < 0 ? TrendingDown : Minus;
  
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors">
      <div className="flex flex-col">
        <span className="text-xs font-mono font-bold text-foreground">{symbol}</span>
        <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{name}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-mono font-semibold text-foreground tabular-nums">
          {price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <div className={cn(
          "flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold",
          isPositive ? "bg-success/15 text-success" : 
          changePercent < 0 ? "bg-destructive/15 text-destructive" : 
          "bg-muted/50 text-muted-foreground"
        )}>
          <Icon className="h-3 w-3" />
          <span>{changePercent > 0 ? '+' : ''}{changePercent.toFixed(2)}%</span>
        </div>
      </div>
    </div>
  );
}

function MarketSection({ 
  title, 
  emoji, 
  markets, 
  color = 'default',
  isLoading 
}: { 
  title: string;
  emoji: string;
  markets: MarketItemProps[];
  color?: 'default' | 'blue' | 'amber' | 'green';
  isLoading?: boolean;
}) {
  const headerColors = {
    default: 'bg-muted/30 border-border/50',
    blue: 'bg-blue-500/10 border-blue-500/30',
    amber: 'bg-amber-500/10 border-amber-500/30',
    green: 'bg-green-500/10 border-green-500/30',
  };

  const titleColors = {
    default: 'text-foreground',
    blue: 'text-blue-400',
    amber: 'text-amber-400',
    green: 'text-green-400',
  };

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/30">
        <CardHeader className={cn("py-2 px-3 border-b", headerColors[color])}>
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent className="p-2 space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/30 h-full">
      <CardHeader className={cn("py-2 px-3 border-b", headerColors[color])}>
        <CardTitle className={cn("text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2", titleColors[color])}>
          <span>{emoji}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 space-y-1">
        {markets.length > 0 ? (
          markets.map((market, idx) => (
            <motion.div
              key={market.symbol}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <MarketItem {...market} />
            </motion.div>
          ))
        ) : (
          <div className="py-4 text-center text-xs text-muted-foreground">
            Dados não disponíveis
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function GlobalMarketsPanel() {
  const { data, isLoading } = useMarketCorrelations();

  // Asian Markets
  const asianMarkets: MarketItemProps[] = [];
  if (data?.nikkei) {
    asianMarkets.push({
      symbol: 'NKY',
      name: data.nikkei.name,
      price: data.nikkei.price,
      changePercent: data.nikkei.changePercent,
      isPositive: data.nikkei.isPositive,
    });
  }
  if (data?.hangSeng) {
    asianMarkets.push({
      symbol: 'HSI',
      name: data.hangSeng.name,
      price: data.hangSeng.price,
      changePercent: data.hangSeng.changePercent,
      isPositive: data.hangSeng.isPositive,
    });
  }
  if (data?.szseComp) {
    asianMarkets.push({
      symbol: 'SZSE',
      name: data.szseComp.name,
      price: data.szseComp.price,
      changePercent: data.szseComp.changePercent,
      isPositive: data.szseComp.isPositive,
    });
  }

  // European Markets
  const europeanMarkets: MarketItemProps[] = [];
  if (data?.dax) {
    europeanMarkets.push({
      symbol: 'DAX',
      name: data.dax.name,
      price: data.dax.price,
      changePercent: data.dax.changePercent,
      isPositive: data.dax.isPositive,
    });
  }
  if (data?.ftse) {
    europeanMarkets.push({
      symbol: 'FTSE',
      name: data.ftse.name,
      price: data.ftse.price,
      changePercent: data.ftse.changePercent,
      isPositive: data.ftse.isPositive,
    });
  }
  if (data?.stoxx50) {
    europeanMarkets.push({
      symbol: 'SX5E',
      name: data.stoxx50.name,
      price: data.stoxx50.price,
      changePercent: data.stoxx50.changePercent,
      isPositive: data.stoxx50.isPositive,
    });
  }

  // US Futures
  const usFutures: MarketItemProps[] = [];
  if (data?.sp500Futures) {
    usFutures.push({
      symbol: 'ES1!',
      name: data.sp500Futures.name,
      price: data.sp500Futures.price,
      changePercent: data.sp500Futures.changePercent,
      isPositive: data.sp500Futures.isPositive,
    });
  }
  if (data?.nasdaqFutures) {
    usFutures.push({
      symbol: 'NQ1!',
      name: data.nasdaqFutures.name,
      price: data.nasdaqFutures.price,
      changePercent: data.nasdaqFutures.changePercent,
      isPositive: data.nasdaqFutures.isPositive,
    });
  }
  if (data?.dowFutures) {
    usFutures.push({
      symbol: 'YM1!',
      name: data.dowFutures.name,
      price: data.dowFutures.price,
      changePercent: data.dowFutures.changePercent,
      isPositive: data.dowFutures.isPositive,
    });
  }

  // Key Indicators (DXY, VIX, Yields, Commodities)
  const keyIndicators: MarketItemProps[] = [];
  if (data?.dxy) {
    keyIndicators.push({
      symbol: 'DXY',
      name: data.dxy.name,
      price: data.dxy.price,
      changePercent: data.dxy.changePercent,
      isPositive: data.dxy.isPositive,
    });
  }
  if (data?.vix) {
    keyIndicators.push({
      symbol: 'VIX',
      name: data.vix.name,
      price: data.vix.price,
      changePercent: data.vix.changePercent,
      isPositive: data.vix.isPositive,
    });
  }
  if (data?.us10y) {
    keyIndicators.push({
      symbol: 'US10Y',
      name: data.us10y.name,
      price: data.us10y.price,
      changePercent: data.us10y.changePercent,
      isPositive: data.us10y.isPositive,
    });
  }
  if (data?.gold) {
    keyIndicators.push({
      symbol: 'XAU',
      name: data.gold.name,
      price: data.gold.price,
      changePercent: data.gold.changePercent,
      isPositive: data.gold.isPositive,
    });
  }
  if (data?.oil) {
    keyIndicators.push({
      symbol: 'CL1!',
      name: data.oil.name,
      price: data.oil.price,
      changePercent: data.oil.changePercent,
      isPositive: data.oil.isPositive,
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MarketSection 
          title="Ásia / Pacífico" 
          emoji="🌏" 
          markets={asianMarkets}
          color="amber"
          isLoading={isLoading}
        />
        <MarketSection 
          title="Europa" 
          emoji="🇪🇺" 
          markets={europeanMarkets}
          color="blue"
          isLoading={isLoading}
        />
        <MarketSection 
          title="EUA Futuros" 
          emoji="🇺🇸" 
          markets={usFutures}
          color="green"
          isLoading={isLoading}
        />
        <MarketSection 
          title="Indicadores-Chave" 
          emoji="📊" 
          markets={keyIndicators}
          color="default"
          isLoading={isLoading}
        />
      </div>
    </motion.div>
  );
}

import { useState } from 'react';
import { TrendingUp, TrendingDown, ChevronDown, DollarSign, Coins, BarChart3, Fuel, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface AssetTip {
  id: string;
  symbol: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'forex' | 'indices' | 'commodities';
  long: string[];
  short: string[];
}

const assetTips: AssetTip[] = [
  {
    id: 'xauusd',
    symbol: 'XAU/USD',
    name: 'Ouro',
    icon: Coins,
    category: 'commodities',
    long: ['DXY caindo', 'VIX subindo', 'Yields caindo', 'Dados de inflação fortes'],
    short: ['DXY subindo forte', 'VIX baixo', 'Fed hawkish', 'Yields subindo'],
  },
  {
    id: 'eurusd',
    symbol: 'EUR/USD',
    name: 'Euro/Dólar',
    icon: DollarSign,
    category: 'forex',
    long: ['DXY caindo', 'ECB hawkish', 'Dados fortes da Zona Euro', 'Yields alemães subindo mais que dos EUA'],
    short: ['DXY subindo', 'Fed hawkish', 'Dados fracos da Europa', 'NFP forte nos EUA'],
  },
  {
    id: 'gbpusd',
    symbol: 'GBP/USD',
    name: 'Libra/Dólar',
    icon: DollarSign,
    category: 'forex',
    long: ['DXY fraco', 'BOE hawkish', 'Inflação UK alta', 'EUR/GBP caindo'],
    short: ['DXY forte', 'BOE dovish', 'Dados fracos UK', 'Crise política'],
  },
  {
    id: 'usdjpy',
    symbol: 'USD/JPY',
    name: 'Dólar/Iene',
    icon: DollarSign,
    category: 'forex',
    long: ['Yields dos EUA subindo', 'Fed hawkish', 'Risk-on', 'Nikkei subindo', 'Diferencial de juros aumentando'],
    short: ['Risk-off forte', 'VIX disparando', 'Yields caindo', 'Crise global (JPY safe haven)'],
  },
  {
    id: 'audusd',
    symbol: 'AUD/USD',
    name: 'Dólar Australiano',
    icon: DollarSign,
    category: 'forex',
    long: ['Risk-on', 'Commodities subindo', 'China forte (HK50 subindo)', 'DXY caindo', 'S&P 500 subindo'],
    short: ['Risk-off', 'Commodities caindo', 'China fraca', 'DXY forte', 'VIX alto'],
  },
  {
    id: 'nzdusd',
    symbol: 'NZD/USD',
    name: 'Dólar Neozelandês',
    icon: DollarSign,
    category: 'forex',
    long: ['Mesmas condições do AUD/USD', 'Preços de lácteos subindo'],
    short: ['Mesmas condições negativas do AUD/USD'],
  },
  {
    id: 'usdcad',
    symbol: 'USD/CAD',
    name: 'Dólar/Canadense',
    icon: DollarSign,
    category: 'forex',
    long: ['Petróleo caindo forte', 'DXY subindo', 'BOC dovish', 'Fed hawkish'],
    short: ['Petróleo subindo forte', 'DXY caindo', 'BOC hawkish', 'Risk-on'],
  },
  {
    id: 'usdchf',
    symbol: 'USD/CHF',
    name: 'Dólar/Franco Suíço',
    icon: DollarSign,
    category: 'forex',
    long: ['Risk-on forte', 'VIX baixo', 'DXY forte', 'Ações subindo'],
    short: ['Risk-off', 'Crise global', 'VIX alto', 'Busca por segurança'],
  },
  {
    id: 'spx',
    symbol: 'S&P 500',
    name: 'S&P 500',
    icon: BarChart3,
    category: 'indices',
    long: ['VIX baixo', 'Dados econômicos fortes', 'Fed dovish/neutro', 'Earnings positivos', 'Risk-on'],
    short: ['VIX disparando', 'Dados fracos', 'Fed muito hawkish', 'Recessão iminente'],
  },
  {
    id: 'win',
    symbol: 'WIN1!',
    name: 'Ibovespa Futuro',
    icon: BarChart3,
    category: 'indices',
    long: ['S&P 500 subindo', 'Commodities fortes', 'Petróleo alto', 'China forte', 'Risk-on', 'Real forte'],
    short: ['S&P 500 caindo', 'Risk-off global', 'Commodities fracas', 'Crise política Brasil'],
  },
  {
    id: 'wdo',
    symbol: 'WDO1!',
    name: 'Dólar Futuro',
    icon: DollarSign,
    category: 'indices',
    long: ['DXY forte', 'Risk-off global', 'Commodities fracas', 'Crise política Brasil', 'Fed hawkish'],
    short: ['DXY fraco', 'Risk-on', 'Commodities fortes', 'S&P subindo', 'Selic alta', 'Superávit comercial'],
  },
  {
    id: 'oil',
    symbol: 'OIL',
    name: 'Petróleo',
    icon: Fuel,
    category: 'commodities',
    long: ['OPEC+ cortando produção', 'China forte', 'Tensões Oriente Médio', 'Estoques caindo', 'Demanda global forte'],
    short: ['OPEC+ aumentando produção', 'China fraca', 'Estoques subindo forte', 'Recessão iminente'],
  },
  {
    id: 'natgas',
    symbol: 'NATGAS',
    name: 'Gás Natural',
    icon: Flame,
    category: 'commodities',
    long: ['Previsão de inverno rigoroso', 'Estoques baixos', 'Crise na Europa', 'Produção caindo'],
    short: ['Inverno ameno previsto', 'Estoques altos', 'Produção recordes', 'Demanda fraca'],
  },
];

const categoryLabels = {
  forex: 'Forex',
  indices: 'Índices',
  commodities: 'Commodities',
};

const categoryColors = {
  forex: 'bg-blue-500/20 text-blue-400',
  indices: 'bg-purple-500/20 text-purple-400',
  commodities: 'bg-amber-500/20 text-amber-400',
};

export function LongShortTips() {
  const [selectedAsset, setSelectedAsset] = useState<AssetTip>(assetTips[0]);

  return (
    <Card className="border-border/30 bg-card/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
            Dicas Long/Short
          </CardTitle>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-background">
                <selectedAsset.icon className="h-4 w-4" />
                {selectedAsset.symbol}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
              <ScrollArea className="h-[300px]">
                {Object.entries(
                  assetTips.reduce((acc, tip) => {
                    if (!acc[tip.category]) acc[tip.category] = [];
                    acc[tip.category].push(tip);
                    return acc;
                  }, {} as Record<string, AssetTip[]>)
                ).map(([category, tips]) => (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                      {categoryLabels[category as keyof typeof categoryLabels]}
                    </div>
                    {tips.map((tip) => (
                      <DropdownMenuItem
                        key={tip.id}
                        onClick={() => setSelectedAsset(tip)}
                        className="cursor-pointer"
                      >
                        <tip.icon className="h-4 w-4 mr-2" />
                        <span className="flex-1">{tip.symbol}</span>
                        {selectedAsset.id === tip.id && (
                          <Badge variant="secondary" className="text-xs">
                            Ativo
                          </Badge>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </div>
                ))}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge className={categoryColors[selectedAsset.category]}>
            {categoryLabels[selectedAsset.category]}
          </Badge>
          <span className="text-sm text-muted-foreground">{selectedAsset.name}</span>
        </div>

        {/* Long Tips */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm font-semibold text-green-500">LONG {selectedAsset.symbol}</span>
          </div>
          <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
            <ul className="space-y-1">
              {selectedAsset.long.map((tip, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Short Tips */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <span className="text-sm font-semibold text-red-500">SHORT {selectedAsset.symbol}</span>
          </div>
          <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
            <ul className="space-y-1">
              {selectedAsset.short.map((tip, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BookOpen, 
  ChevronDown, 
  TrendingUp, 
  AlertTriangle, 
  Flame,
  Wheat,
  BarChart3,
  DollarSign,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';

const strategies = [
  {
    id: 1,
    title: 'Análise Multi-Indicador para Forex',
    icon: TrendingUp,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    steps: [
      'Identifique o par que deseja operar (ex: EUR/USD)',
      'Verifique DXY: está em tendência clara? Rompeu algum nível?',
      'Compare yields: US 10Y vs Germany 10Y (para EUR/USD)',
      'Veja o sentimento: VIX, S&P 500',
      'Confira correlações: EUR/GBP, EUR/JPY estão alinhados?',
      'Análise técnica no par específico',
      'DECISÃO: Se todos os fatores apontam na mesma direção = convicção alta'
    ]
  },
  {
    id: 2,
    title: 'Trading de Sentimento de Risco',
    icon: AlertTriangle,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    steps: [
      'Risk-On confirmado: VIX < 15 + S&P subindo + Yields estáveis',
      '→ LONG AUD/USD, NZD/USD, EUR/JPY, GBP/JPY, Índices',
      '',
      'Risk-Off confirmado: VIX > 25 + S&P caindo forte + Fuga para qualidade',
      '→ LONG JPY, CHF, Ouro / SHORT AUD, NZD, Ações'
    ]
  },
  {
    id: 3,
    title: 'Estratégia para Petróleo',
    icon: Flame,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    steps: [
      'Verifique: Relatório EIA (estoques), decisões OPEC+, dados China',
      'Correlações: DXY (inverso), USD/CAD (inverso), S&P 500 (positivo)'
    ]
  },
  {
    id: 4,
    title: 'Commodities Agrícolas',
    icon: Wheat,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    steps: [
      'Verifique: DXY, clima nas regiões produtoras, relatórios USDA',
      'Para Café/Açúcar (Brasil): monitore Real (BRL), clima Brasil'
    ]
  },
  {
    id: 5,
    title: 'WIN (Ibovespa)',
    icon: BarChart3,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    steps: [
      'Confira: S&P 500, commodities (petróleo, minério), China (HK50)',
      'Se tudo risk-on + commodities fortes = LONG WIN com convicção'
    ]
  },
  {
    id: 6,
    title: 'WDO (Dólar)',
    icon: DollarSign,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    steps: [
      'Confira: DXY, S&P 500 (inverso), commodities (inverso)',
      'DXY subindo + risk-off global = LONG WDO',
      'DXY caindo + risk-on + commodities fortes = SHORT WDO'
    ]
  }
];

export function TradingStrategies() {
  const [selectedStrategy, setSelectedStrategy] = useState(strategies[0]);

  const SelectedIcon = selectedStrategy.icon;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Estratégias de Trade
          </CardTitle>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 bg-secondary/50">
                <SelectedIcon className={cn('h-4 w-4', selectedStrategy.color)} />
                <span className="hidden sm:inline text-sm">{selectedStrategy.title}</span>
                <span className="sm:hidden text-sm">#{selectedStrategy.id}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-background border-border">
              {strategies.map((strategy) => {
                const Icon = strategy.icon;
                return (
                  <DropdownMenuItem
                    key={strategy.id}
                    onClick={() => setSelectedStrategy(strategy)}
                    className={cn(
                      'gap-3 cursor-pointer',
                      selectedStrategy.id === strategy.id && 'bg-secondary'
                    )}
                  >
                    <div className={cn('p-1.5 rounded-md', strategy.bgColor)}>
                      <Icon className={cn('h-4 w-4', strategy.color)} />
                    </div>
                    <span className="text-sm">{strategy.title}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className={cn(
          'p-3 rounded-lg border mb-4',
          selectedStrategy.bgColor,
          'border-border/50'
        )}>
          <div className="flex items-center gap-2 mb-2">
            <SelectedIcon className={cn('h-5 w-5', selectedStrategy.color)} />
            <h3 className="font-semibold">{selectedStrategy.title}</h3>
            <Badge variant="secondary" className="text-[10px] font-mono">
              #{selectedStrategy.id}
            </Badge>
          </div>
        </div>

        <ScrollArea className="h-[280px]">
          <div className="space-y-2 pr-4">
            {selectedStrategy.steps.map((step, index) => (
              step ? (
                <div 
                  key={index}
                  className={cn(
                    'p-3 rounded-lg border transition-all',
                    step.startsWith('→') 
                      ? 'bg-primary/10 border-primary/30 pl-6' 
                      : 'bg-secondary/30 border-border/30'
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!step.startsWith('→') && (
                      <span className="text-xs font-mono text-muted-foreground shrink-0 mt-0.5">
                        {index + 1}.
                      </span>
                    )}
                    <p className={cn(
                      'text-sm',
                      step.startsWith('→') && 'text-primary font-medium',
                      step.includes('DECISÃO') && 'font-semibold text-green-400'
                    )}>
                      {step}
                    </p>
                  </div>
                </div>
              ) : (
                <div key={index} className="h-2" />
              )
            ))}
          </div>
        </ScrollArea>

        {/* Dica de Ouro */}
        <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-400 mb-1">DICA DE OURO</p>
              <p className="text-xs text-muted-foreground">
                Não opere contra todas as correlações. As melhores operações são aquelas onde múltiplos fatores se alinham na mesma direção.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

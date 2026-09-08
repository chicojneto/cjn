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

import { 
  BookOpen, 
  ChevronDown, 
  TrendingUp, 
  AlertTriangle, 
  Flame,
  Wheat,
  BarChart3,
  DollarSign,
  Lightbulb,
  Shield,
  CreditCard,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UpdatedStamp } from '@/components/shared/UpdatedStamp';
import { isArchived } from '@/lib/contentFreshness';

const strategies = [
  {
    id: 1,
    title: 'Análise Multi-Indicador Forex',
    updated: '2026-08-05',
    icon: TrendingUp,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    steps: [
      'Identifique o par que deseja operar',
      'Verifique DXY: direção e níveis (high-90s = mínimas 3 anos)',
      'Compare yields: diferencial de juros entre países',
      'Veja VIX (<15 calmo, 15-20 atenção, 20-25 elevado, >25 stress)',
      'Confira correlações: pares relacionados confirmam?',
      'Polymarket: probabilidade de eventos geopolíticos?',
      'HYG/JNK: crédito estável ou caindo?',
      'BTC: canário para NASDAQ/risk assets',
      'Análise técnica no par específico',
      '→ DECISÃO: Se todos os fatores apontam na mesma direção = convicção alta'
    ]
  },
  {
    id: 2,
    title: 'Sentimento de Risco (Risk-On/Off)',
    updated: '2026-08-05',
    icon: AlertTriangle,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    steps: [
      'RISK-ON confirmado:',
      '→ VIX < 15 + S&P subindo + Yields estáveis',
      '→ LONG AUD/USD, NZD/USD, EUR/JPY, GBP/JPY, Índices',
      '',
      'RISK-OFF confirmado:',
      '→ VIX > 25 + S&P caindo + Fuga para qualidade',
      '→ LONG JPY, CHF, Ouro / SHORT AUD, NZD, Ações',
      '',
      'AI ROTATION (Fev/2026):',
      '→ VIX 20-25 + S&P caindo + mas staples/utilities subindo',
      '→ NÃO é risk-off clássico, é repricing setorial de AI',
      '→ WIN pode ficar lateral. Cuidado com sinais mistos!'
    ]
  },
  {
    id: 3,
    title: 'Commodities Energéticas',
    updated: '2026-08-05',
    icon: Flame,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    steps: [
      'Verifique: Relatório EIA, decisões OPEC+, dados China',
      'ALERTA IRÃ: Tensões EUA-Irã = fator geopolítico #1',
      '→ Polymarket: probabilidade de ataque (55% até junho/2026)',
      '→ Se escalar: petróleo dispara, CAD sobe, inflação volta',
      'Correlações: DXY (inverso), USD/CAD (inverso), S&P 500 (positivo)',
      '',
      'LONG Petróleo: Tensões Irã + OPEC cortando + China forte + estoques caindo',
      'SHORT Petróleo: Negociações avançam + OPEC+ aumenta + recessão + estoques subindo'
    ]
  },
  {
    id: 4,
    title: 'Commodities Agrícolas',
    updated: '2026-08-05',
    icon: Wheat,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    steps: [
      'Verifique: DXY, clima nas regiões produtoras, relatórios USDA',
      'Para Café/Açúcar (Brasil): monitore Real (BRL), clima Brasil',
      'Correlações mantidas conforme guia original'
    ]
  },
  {
    id: 5,
    title: 'WIN (Ibovespa Futuro)',
    updated: '2026-08-05',
    icon: BarChart3,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    steps: [
      'Confira: S&P 500, commodities (petróleo, minério), China (HK50)',
      'Fluxo gringo: monitorar EWZ (ETF Brasil NY) diariamente',
      'Ibovespa em ~182k pts - fluxo estrangeiro massivo',
      'IPCA-15 desacelerando = espaço para cortes Selic',
      '[RISCO] Selloff tech/AI nos EUA pode secar fluxo → WIN sofre',
      '[RISCO] Eleições 2026 já no radar - polarização pode provocar saída',
      '',
      'LONG WIN: S&P subindo + commodities fortes + fluxo gringo + Selic caindo',
      'SHORT WIN: Risk-off global + AI selloff + crise política + DXY disparando'
    ]
  },
  {
    id: 6,
    title: 'WDO (Dólar Futuro)',
    updated: '2026-08-05',
    icon: DollarSign,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    steps: [
      'Confira: DXY, S&P 500 (inverso), commodities (inverso)',
      'Dólar/Real: R$5.20-5.30, menor em 2 anos',
      'Se Irã escalar: dólar sobe contra TODAS moedas EM',
      'PTAX: dias 29/30/último útil = distorções',
      'Cupom cambial (DDI-DI): indicador de pressão cambial real',
      '',
      'LONG WDO: DXY forte + risk-off + Irã escala + commodities fracas + crise BR',
      'SHORT WDO: DXY fraco + risk-on + commodities fortes + fluxo gringo + Selic alta'
    ]
  },
  {
    id: 7,
    title: 'Contingência Geopolítica',
    updated: '2026-08-05',
    icon: Globe,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    steps: [
      'PRÉ-PROGRAMAR ordens para evento Irã:',
      '→ Compra Ouro',
      '→ Compra WDO',
      '→ Venda S&P/NQ',
      '',
      'TRIGGERS:',
      '→ Polymarket >40% para mês corrente',
      '→ Notícia de ataque/mobilização militar',
      '',
      '⚠️ Execução deve ser INSTANTÂNEA - em pânico não há tempo para pensar'
    ]
  },
  {
    id: 8,
    title: 'Monitoramento de Crédito',
    updated: '2026-08-05',
    icon: CreditCard,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    steps: [
      'CRÉDITO ANTECEDE BOLSA em 2-3 meses',
      '',
      'Se HYG/JNK caindo com volume alto por 5+ dias:',
      '→ Reduzir exposição a risco em 50%',
      '→ Mesmo se bolsa ainda não caiu!',
      '',
      'Se HY spreads passarem de 4%:',
      '→ Modo defensivo TOTAL',
      '',
      'Jamie Dimon alertou sobre "baratas" no crédito auto',
      'Empresas AI precisam levantar US$86bi em bonds em 2026'
    ]
  },
  {
    id: 9,
    title: 'Regras de Risco Dinâmico',
    updated: '2026-08-05',
    icon: Shield,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/20',
    steps: [
      '📊 SIZING POR VIX:',
      '→ VIX > 20: sizing x0.7',
      '→ VIX > 25: sizing x0.5',
      '→ VIX > 30: sizing x0.3 ou fora',
      '',
      '⚠️ REGRAS AUTOMÁTICAS:',
      '→ HY spreads > 4%: reduzir TODA exposição em 50%',
      '→ Dados EUA adiados (shutdown): sizing mínimo',
      '→ Polymarket Irã > 40%: ativar hedge, sizing -50%',
      '→ BTC cair > 10% em 1 dia: reduzir NQ/S&P',
      '→ USD/JPY romper 140: LIQUIDAR posições de risco',
      '→ 2+ pernas stopadas: tese errada, fechar TUDO'
    ]
  },
  {
    id: 10,
    title: 'Rotação Setorial por Ciclo (PDF)',
    updated: '2026-08-05',
    icon: Globe,
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/20',
    steps: [
      '📊 FRAMEWORK: PIB → INFLAÇÃO → JUROS → GRÁFICO',
      '',
      'PIB acelerando + Inflação controlada (GOLDILOCKS):',
      '→ LONG ações, small caps, cíclicos, emergentes',
      '→ SHORT dólar, renda fixa longa',
      '',
      'PIB acelerando + Inflação subindo (SUPERAQUECIMENTO):',
      '→ LONG commodities, bancos, energia, dólar',
      '→ SHORT tech/growth, small caps, bonds longos',
      '',
      'PIB desacelerando + Inflação caindo (DESACELERAÇÃO):',
      '→ LONG bonds, utilities, saúde, renda fixa',
      '→ SHORT cíclicos, commodities, small caps',
      '',
      'PIB fraco + Inflação alta (ESTAGFLAÇÃO):',
      '→ LONG ouro, dólar, commodities duras, cash',
      '→ SHORT ações em geral, bonds longos, emergentes',
      '',
      '⚠️ Juros subindo: favorece bancos/seguradoras. Evite tech.',
      '⚠️ Juros caindo: favorece bolsa, small caps, risco.'
    ]
  }
];

export function TradingStrategies() {
  const [selectedStrategy, setSelectedStrategy] = useState(strategies[0]);
  const [showOld, setShowOld] = useState(false);

  const archivedCount = strategies.filter((s) => isArchived(s.updated)).length;
  const visibleStrategies = showOld ? strategies : strategies.filter((s) => !isArchived(s.updated));

  const SelectedIcon = selectedStrategy.icon;

  return (
    <Card className="border-border/30 bg-card/50">
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
            <UpdatedStamp date={selectedStrategy.updated} className="ml-auto" />
          </div>
        </div>

        {(() => {
          let stepNumber = 0;
          return (
            <div className="space-y-2">
              {selectedStrategy.steps.map((step, index) => {
                if (!step) return <div key={index} className="h-2" />;
                const isArrow = step.startsWith('→');
                const isAlert = step.startsWith('⚠️') || step.startsWith('📊');
                const numbered = !isArrow && !isAlert;
                if (numbered) stepNumber += 1;
                const currentNumber = stepNumber;
                return (
                  <div
                    key={index}
                    className={cn(
                      'p-3 rounded-lg border transition-all',
                      isArrow
                        ? 'bg-primary/10 border-primary/30 pl-6'
                        : step.startsWith('[RISCO]')
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : isAlert
                        ? 'bg-rose-500/10 border-rose-500/30'
                        : 'bg-secondary/30 border-border/30'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {numbered && (
                        <span className="text-xs font-mono text-muted-foreground shrink-0 mt-0.5">
                          {currentNumber}.
                        </span>
                      )}
                      <p className={cn(
                        'text-sm',
                        isArrow && 'text-primary font-medium',
                        step.includes('DECISÃO') && 'font-semibold text-green-400',
                        step.startsWith('[RISCO]') && 'text-amber-400',
                        (step.includes('LONG') || step.includes('SHORT')) && 'font-medium'
                      )}>
                        {step}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}


      </CardContent>
    </Card>
  );
}

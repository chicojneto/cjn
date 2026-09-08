import { useState } from 'react';
import { TrendingUp, TrendingDown, ChevronDown, DollarSign, Coins, BarChart3, Fuel, Flame, AlertTriangle, CheckCircle2, Circle, PenLine } from 'lucide-react';
import { useMarketCorrelations } from '@/hooks/useMarketCorrelations';
import { evaluateCondition, summarize, type EvaluatedCondition } from '@/lib/longShortConditions';
import { isArchived } from '@/lib/contentFreshness';
import { UpdatedStamp } from '@/components/shared/UpdatedStamp';
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

export interface Tip {
  text: string;
  /** ISO date (YYYY-MM-DD) da última revisão do item */
  updated: string;
}

interface AssetTip {
  id: string;
  symbol: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'forex' | 'indices' | 'commodities';
  long: Tip[];
  short: Tip[];
  alerts?: Tip[];
}

const assetTips: AssetTip[] = [
  {
    id: 'xauusd',
    symbol: 'XAU/USD',
    name: 'Ouro',
    icon: Coins,
    category: 'commodities',
    long: [
      { text: 'DXY caindo (correlação enfraquecida: -0.45 vs histórico -0.8)', updated: '2026-07-01' },
      { text: 'VIX subindo (correlação +0.5 a +0.6 em crises)', updated: '2026-07-01' },
      { text: 'Yields caindo (correlação QUEBRADA em períodos)', updated: '2026-07-01' },
      { text: 'Tensão geopolítica (IRÃ = fator #1 agora)', updated: '2026-07-01' },
      { text: 'Fed dovish ou perdendo independência', updated: '2026-07-01' },
      { text: 'Bancos centrais comprando ouro como reserva (recorde)', updated: '2026-08-05' },
      { text: 'Term premium subindo = policy mismatch', updated: '2026-08-05' },
    ],
    short: [
      { text: 'DXY subindo forte', updated: '2026-07-01' },
      { text: 'VIX baixo + mercado calmo', updated: '2026-07-01' },
      { text: 'Fed hawkish + yields reais subindo', updated: '2026-07-01' },
      { text: 'Profit-taking após rally', updated: '2026-07-01' },
      { text: 'Stock-bond correlation em máxima 30 anos', updated: '2026-08-05' },
    ],
    alerts: [
      { text: '⚠️ STOP OBRIGATÓRIO: Ouro pode crashar 10-20% em DIAS (Jan/26: $5.500→$4.500 em 48h)', updated: '2026-07-01' },
      { text: 'Zona de buy-the-dip estrutural: $3.500-$3.700 (State Street/WGC)', updated: '2026-07-01' },
      { text: 'NÃO trate como posição segura. Tail risk brutal.', updated: '2026-07-01' },
    ]
  },
  {
    id: 'eurusd',
    symbol: 'EUR/USD',
    name: 'Euro/Dólar',
    icon: DollarSign,
    category: 'forex',
    long: [
      { text: 'DXY caindo (correlação -0.97, praticamente inverso)', updated: '2026-07-01' },
      { text: 'ECB menos dovish que Fed', updated: '2026-07-01' },
      { text: 'Dados fortes da Zona Euro', updated: '2026-07-01' },
      { text: 'Estímulo fiscal europeu EUR 500bi', updated: '2026-08-05' },
      { text: 'Yields alemães subindo mais que dos EUA', updated: '2026-07-01' },
    ],
    short: [
      { text: 'DXY repricando para cima', updated: '2026-07-01' },
      { text: 'Dados EUA fortes (NFP, CPI)', updated: '2026-07-01' },
      { text: 'Fed hawkish surpresa', updated: '2026-07-01' },
      { text: 'Escalada Irã (flight to USD temporário)', updated: '2026-08-05' },
    ],
    alerts: [
      { text: 'EUR/USD próximo de 1.1900-1.2000, máximas de 3 anos', updated: '2026-07-01' },
      { text: 'Resistência Fibonacci em jogo', updated: '2026-07-01' },
      { text: 'GBP/USD mostra tendência mais limpa para trade de dólar fraco', updated: '2026-07-01' },
    ]
  },
  {
    id: 'gbpusd',
    symbol: 'GBP/USD',
    name: 'Libra/Dólar',
    icon: DollarSign,
    category: 'forex',
    long: [
      { text: 'DXY fraco (correlação -0.85)', updated: '2026-07-01' },
      { text: 'BOE hawkish relativo (cortando mais devagar que Fed)', updated: '2026-07-01' },
      { text: 'Inflação UK alta/persistente', updated: '2026-07-01' },
      { text: 'EUR/GBP caindo (GBP forte)', updated: '2026-07-01' },
      { text: 'PAR PREFERIDO para trade de dólar fraco em 2026', updated: '2026-08-05' },
    ],
    short: [
      { text: 'DXY forte', updated: '2026-07-01' },
      { text: 'BOE dovish surpresa', updated: '2026-07-01' },
      { text: 'Crise fiscal UK (cortes de gastos março)', updated: '2026-08-05' },
      { text: 'Risk-off extremo', updated: '2026-07-01' },
    ],
    alerts: [
      { text: 'Forecasts bancos: GBP/USD 1.36-1.40 em 2026', updated: '2026-07-01' },
      { text: 'Testando 1.3500 como resistência', updated: '2026-07-01' },
      { text: 'Tendência mais limpa que EUR/USD para dólar fraco', updated: '2026-07-01' },
    ]
  },
  {
    id: 'usdjpy',
    symbol: 'USD/JPY',
    name: 'Dólar/Iene',
    icon: DollarSign,
    category: 'forex',
    long: [
      { text: 'Yields EUA subindo (correlação +0.9)', updated: '2026-07-01' },
      { text: 'Risk-on forte', updated: '2026-07-01' },
      { text: 'BOJ dovish surpresa', updated: '2026-07-01' },
      { text: 'Carry trade atrativo', updated: '2026-07-01' },
      { text: 'Nikkei subindo (correlação positiva)', updated: '2026-07-01' },
    ],
    short: [
      { text: 'Risk-off + VIX disparando', updated: '2026-07-01' },
      { text: 'BOJ hawkish (esperado +50bps em 2026)', updated: '2026-07-01' },
      { text: 'Carry unwind sistêmico', updated: '2026-07-01' },
      { text: 'Intervenção japonesa (nível 160 = linha vermelha)', updated: '2026-07-01' },
      { text: 'Diferencial convergindo: Fed cortando + BOJ subindo', updated: '2026-08-05' },
    ],
    alerts: [
      { text: '⚠️ ALERTA: Se USD/JPY romper 140 com velocidade = LIQUIDAR posições de risco', updated: '2026-07-01' },
      { text: 'USD/JPY é 13.6% do DXY. Se carry unwind = DXY desmorona junto', updated: '2026-07-01' },
      { text: 'RISCO DE UNWIND SISTÊMICO - maior carry trade do mundo', updated: '2026-07-01' },
    ]
  },
  {
    id: 'audusd',
    symbol: 'AUD/USD',
    name: 'Dólar Australiano',
    icon: DollarSign,
    category: 'forex',
    long: [
      { text: 'Risk-on forte', updated: '2026-07-01' },
      { text: 'Commodities subindo', updated: '2026-07-01' },
      { text: 'China forte (HK50 subindo)', updated: '2026-07-01' },
      { text: 'DXY caindo', updated: '2026-07-01' },
      { text: 'China anunciou estímulos - monitorar PMIs mensalmente', updated: '2026-08-05' },
    ],
    short: [
      { text: 'Risk-off', updated: '2026-07-01' },
      { text: 'Commodities caindo', updated: '2026-07-01' },
      { text: 'China fraca', updated: '2026-07-01' },
      { text: 'DXY forte', updated: '2026-07-01' },
      { text: 'VIX alto', updated: '2026-07-01' },
    ],
    alerts: [
      { text: 'Correlação +0.9 com NZD/USD', updated: '2026-07-01' },
      { text: 'AUD geralmente preferível (mais liquidez)', updated: '2026-07-01' },
    ]
  },
  {
    id: 'usdcad',
    symbol: 'USD/CAD',
    name: 'Dólar/Canadense',
    icon: DollarSign,
    category: 'forex',
    long: [
      { text: 'Petróleo caindo forte', updated: '2026-07-01' },
      { text: 'DXY subindo', updated: '2026-07-01' },
      { text: 'BOC dovish', updated: '2026-07-01' },
      { text: 'Fed hawkish', updated: '2026-07-01' },
    ],
    short: [
      { text: 'Petróleo subindo forte', updated: '2026-07-01' },
      { text: 'DXY caindo', updated: '2026-07-01' },
      { text: 'BOC hawkish', updated: '2026-07-01' },
      { text: 'Risk-on', updated: '2026-07-01' },
      { text: 'Se tensões Irã escalarem = petróleo dispara = CAD forte = USD/CAD cai forte', updated: '2026-08-05' },
    ]
  },
  {
    id: 'usdchf',
    symbol: 'USD/CHF',
    name: 'Dólar/Franco Suíço',
    icon: DollarSign,
    category: 'forex',
    long: [
      { text: 'Risk-on forte', updated: '2026-07-01' },
      { text: 'VIX baixo', updated: '2026-07-01' },
      { text: 'DXY forte', updated: '2026-07-01' },
      { text: 'Ações subindo', updated: '2026-07-01' },
    ],
    short: [
      { text: 'Risk-off', updated: '2026-07-01' },
      { text: 'Crise global', updated: '2026-07-01' },
      { text: 'VIX alto', updated: '2026-07-01' },
      { text: 'Busca por segurança', updated: '2026-07-01' },
      { text: 'Se Irã escalar = CHF fortalece junto com JPY e ouro', updated: '2026-08-05' },
    ]
  },
  {
    id: 'spx',
    symbol: 'S&P 500',
    name: 'S&P 500',
    icon: BarChart3,
    category: 'indices',
    long: [
      { text: 'DXY caindo (favorece exportações)', updated: '2026-07-01' },
      { text: 'VIX < 15', updated: '2026-07-01' },
      { text: 'Dados econômicos fortes', updated: '2026-07-01' },
      { text: 'Fed dovish/neutro', updated: '2026-07-01' },
      { text: 'Earnings positivos', updated: '2026-07-01' },
      { text: 'Market breadth expandindo', updated: '2026-07-01' },
      { text: 'HYG/JNK estável (crédito saudável)', updated: '2026-08-05' },
    ],
    short: [
      { text: 'DXY subindo forte', updated: '2026-07-01' },
      { text: 'VIX > 25', updated: '2026-07-01' },
      { text: 'Dados fracos', updated: '2026-07-01' },
      { text: 'Fed muito hawkish', updated: '2026-07-01' },
      { text: 'AI repricing (Mag-7 = 30% do índice)', updated: '2026-08-05' },
      { text: 'Market breadth contraindo', updated: '2026-08-05' },
      { text: 'JOLTS colapsando (<6M = recessão)', updated: '2026-08-05' },
      { text: 'HY spreads subindo (>4% = stress)', updated: '2026-08-05' },
    ],
    alerts: [
      { text: 'CONCENTRAÇÃO EXTREMA: 6 ações AI = 30% do S&P 500', updated: '2026-07-01' },
      { text: 'BTC = canário - se BTC cair >10%, NQ/S&P seguem', updated: '2026-07-01' },
    ]
  },
  {
    id: 'nasdaq',
    symbol: 'NASDAQ',
    name: 'Nasdaq Composite',
    icon: BarChart3,
    category: 'indices',
    long: [
      { text: 'DXY caindo (techs se beneficiam muito)', updated: '2026-07-01' },
      { text: 'VIX baixo', updated: '2026-07-01' },
      { text: 'Yields caindo (favorece growth stocks)', updated: '2026-07-01' },
      { text: 'Fed dovish', updated: '2026-07-01' },
      { text: 'Earnings de tech positivos', updated: '2026-07-01' },
      { text: 'Rotação setorial estabiliza', updated: '2026-08-05' },
    ],
    short: [
      { text: 'DXY subindo forte (40% receita vem de fora EUA)', updated: '2026-07-01' },
      { text: 'VIX alto', updated: '2026-07-01' },
      { text: 'Yields subindo (pressiona valuations)', updated: '2026-07-01' },
      { text: 'Fed muito hawkish', updated: '2026-07-01' },
      { text: 'AI CAPEX SELLOFF em curso', updated: '2026-08-05' },
      { text: 'Alphabet $185bi + Amazon $200bi = repricing', updated: '2026-08-05' },
      { text: 'Rotação para staples, utilities, telecom', updated: '2026-08-05' },
    ],
    alerts: [
      { text: 'NASDAQ: 22.540 - caiu 4% na semana (pior sequência desde abril)', updated: '2026-07-01' },
      { text: 'Negativo no ano (-3%)', updated: '2026-07-01' },
      { text: 'BTC em $63k no selloff - altamente correlacionado', updated: '2026-07-01' },
    ]
  },
  {
    id: 'win',
    symbol: 'WIN1!',
    name: 'Ibovespa Futuro',
    icon: BarChart3,
    category: 'indices',
    long: [
      { text: 'S&P 500 subindo', updated: '2026-07-01' },
      { text: 'Commodities fortes (petróleo, minério)', updated: '2026-07-01' },
      { text: 'Real forte', updated: '2026-07-01' },
      { text: 'Fluxo gringo entrando', updated: '2026-07-01' },
      { text: 'Selic caindo', updated: '2026-07-01' },
      { text: 'IPCA-15 desacelerando = espaço cortes', updated: '2026-08-05' },
      { text: 'EWZ (ETF Brasil NY) subindo no pré-mercado', updated: '2026-08-05' },
    ],
    short: [
      { text: 'Risk-off global', updated: '2026-07-01' },
      { text: 'AI selloff seca fluxo', updated: '2026-07-01' },
      { text: 'Crise política Brasil', updated: '2026-07-01' },
      { text: 'DXY disparando', updated: '2026-07-01' },
      { text: 'Eleições 2026 provocando saída de fluxo', updated: '2026-08-05' },
    ],
    alerts: [
      { text: 'Ibovespa ~182.695 pts - fluxo estrangeiro massivo', updated: '2026-07-01' },
      { text: 'RISCO: Selloff tech/AI nos EUA seca fluxo global', updated: '2026-07-01' },
    ]
  },
  {
    id: 'wdo',
    symbol: 'WDO1!',
    name: 'Dólar Futuro',
    icon: DollarSign,
    category: 'indices',
    long: [
      { text: 'DXY forte (correlação +0.9)', updated: '2026-07-01' },
      { text: 'Risk-off global', updated: '2026-07-01' },
      { text: 'Commodities fracas', updated: '2026-07-01' },
      { text: 'Crise política Brasil', updated: '2026-07-01' },
      { text: 'Irã escala = dólar sobe contra TODAS moedas EM', updated: '2026-08-05' },
    ],
    short: [
      { text: 'DXY fraco', updated: '2026-07-01' },
      { text: 'Risk-on', updated: '2026-07-01' },
      { text: 'Commodities fortes', updated: '2026-07-01' },
      { text: 'S&P subindo', updated: '2026-07-01' },
      { text: 'Selic alta + Fed cortando = diferencial', updated: '2026-07-01' },
      { text: 'Fluxo gringo massivo para Brasil', updated: '2026-08-05' },
    ],
    alerts: [
      { text: 'Dólar/Real: R$5.20-5.30 (menor em 2 anos)', updated: '2026-07-01' },
      { text: 'PTAX: dias 29/30/último útil = distorções', updated: '2026-07-01' },
      { text: 'Cupom cambial (DDI-DI) = indicador real de pressão', updated: '2026-07-01' },
    ]
  },
  {
    id: 'oil',
    symbol: 'CL1!',
    name: 'Petróleo WTI',
    icon: Fuel,
    category: 'commodities',
    long: [
      { text: 'TENSÕES IRÃ = FATOR #1 AGORA', updated: '2026-08-05' },
      { text: 'OPEC+ cortando produção', updated: '2026-07-01' },
      { text: 'China forte', updated: '2026-07-01' },
      { text: 'Estoques caindo', updated: '2026-07-01' },
      { text: 'Polymarket: 55% chance ataque até junho', updated: '2026-07-01' },
    ],
    short: [
      { text: 'Negociações Irã avançam', updated: '2026-07-01' },
      { text: 'OPEC+ aumentando produção', updated: '2026-07-01' },
      { text: 'Recessão iminente', updated: '2026-07-01' },
      { text: 'Estoques subindo forte', updated: '2026-07-01' },
      { text: 'China fraca', updated: '2026-07-01' },
    ],
    alerts: [
      { text: 'Armada naval EUA posicionada + negociações Omã', updated: '2026-07-01' },
      { text: 'Se probabilidade >40%: ajustar CAD, BRL, energia', updated: '2026-07-01' },
      { text: 'Preços esperados em queda SEM evento geopolítico', updated: '2026-07-01' },
    ]
  },
  {
    id: 'natgas',
    symbol: 'NG1!',
    name: 'Gás Natural',
    icon: Flame,
    category: 'commodities',
    long: [
      { text: 'Previsão de inverno rigoroso', updated: '2026-07-01' },
      { text: 'Estoques baixos', updated: '2026-07-01' },
      { text: 'Crise na Europa', updated: '2026-07-01' },
      { text: 'Produção caindo', updated: '2026-07-01' },
    ],
    short: [
      { text: 'Inverno ameno previsto', updated: '2026-07-01' },
      { text: 'Estoques altos', updated: '2026-07-01' },
      { text: 'Produção recordes', updated: '2026-07-01' },
      { text: 'Demanda fraca', updated: '2026-07-01' },
    ]
  }
];

const categoryLabels = {
  forex: 'Forex',
  indices: 'Índices',
  commodities: 'Commodities',
};

const categoryColors = {
  forex: 'bg-muted/20 text-muted-foreground',
  indices: 'bg-muted/20 text-muted-foreground',
  commodities: 'bg-warning/20 text-warning',
};

const PRIORITY_IDS = ['win', 'wdo', 'xauusd', 'nasdaq', 'spx'];

type DatedCondition = EvaluatedCondition & { updated: string };

function ConditionList({
  items,
  tone,
}: {
  items: DatedCondition[];
  tone: 'long' | 'short';
}) {
  return (
    <ul className="space-y-1.5">
      {items.map((c, index) => {
        const Icon = c.status === 'met' ? CheckCircle2 : c.status === 'unmet' ? Circle : PenLine;
        const iconClass =
          c.status === 'met'
            ? tone === 'long'
              ? 'text-success'
              : 'text-destructive'
            : c.status === 'unmet'
            ? 'text-muted-foreground/40'
            : 'text-muted-foreground/60';
        return (
          <li key={index} className="text-sm flex items-start gap-2">
            <Icon
              className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${iconClass}`}
              aria-label={c.status === 'met' ? 'condição atendida' : c.status === 'unmet' ? 'condição não atendida' : 'avaliação manual'}
            />
            <span className={c.status === 'met' ? 'text-foreground' : 'text-muted-foreground'}>
              {c.text}
              {c.detail && (
                <span className="ml-1.5 font-mono text-xs text-muted-foreground">{c.detail}</span>
              )}
              {c.status === 'manual' && (
                <span className="ml-1.5 text-[10px] uppercase tracking-wide text-muted-foreground/70">manual</span>
              )}
              <UpdatedStamp date={c.updated} className="ml-2" />
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function LongShortTips() {
  const [selectedAsset, setSelectedAsset] = useState<AssetTip>(
    assetTips.find((a) => a.id === 'win') ?? assetTips[0]
  );
  const [showOthers, setShowOthers] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const { data } = useMarketCorrelations();

  const priorityTips = PRIORITY_IDS
    .map((id) => assetTips.find((a) => a.id === id))
    .filter((a): a is AssetTip => Boolean(a));
  const otherTips = assetTips.filter((a) => !PRIORITY_IDS.includes(a.id));

  const toDated = (tips: Tip[]): DatedCondition[] =>
    tips.map((t) => ({ ...evaluateCondition(t.text, data), updated: t.updated }));

  const allLong = toDated(selectedAsset.long);
  const allShort = toDated(selectedAsset.short);
  const alerts = selectedAsset.alerts ?? [];
  const hiddenCount =
    [...allLong, ...allShort].filter((c) => isArchived(c.updated)).length +
    alerts.filter((a) => isArchived(a.updated)).length;

  const visible = (list: DatedCondition[]) => (showOld ? list : list.filter((c) => !isArchived(c.updated)));
  const longConds = visible(allLong);
  const shortConds = visible(allShort);
  const visibleAlerts = showOld ? alerts : alerts.filter((a) => !isArchived(a.updated));
  const longSummary = summarize(longConds);
  const shortSummary = summarize(shortConds);

  const renderItem = (tip: AssetTip) => (
    <DropdownMenuItem key={tip.id} onClick={() => setSelectedAsset(tip)} className="cursor-pointer">
      <tip.icon className="h-4 w-4 mr-2" />
      <span className="flex-1">{tip.symbol}</span>
      {selectedAsset.id === tip.id && (
        <Badge variant="secondary" className="text-xs">
          Ativo
        </Badge>
      )}
    </DropdownMenuItem>
  );

  return (
    <Card className="border-border/30 bg-card/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-success" />
              <TrendingDown className="h-4 w-4 text-destructive" />
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
              <ScrollArea className="max-h-[320px]">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                  Principais
                </div>
                {priorityTips.map(renderItem)}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowOthers((v) => !v);
                  }}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase hover:text-foreground"
                >
                  Outros
                  <ChevronDown className={`h-3 w-3 transition-transform ${showOthers ? 'rotate-180' : ''}`} />
                </button>
                {showOthers && otherTips.map(renderItem)}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={categoryColors[selectedAsset.category]}>
            {categoryLabels[selectedAsset.category]}
          </Badge>
          <span className="text-sm text-muted-foreground">{selectedAsset.name}</span>
          {hiddenCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs ml-auto"
              onClick={() => setShowOld((v) => !v)}
            >
              {showOld ? 'ocultar antigos' : `mostrar antigos (${hiddenCount})`}
            </Button>
          )}
        </div>

        {/* Alerts Section */}
        {visibleAlerts.length > 0 && (
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-xs font-semibold text-warning">ALERTAS</span>
            </div>
            {visibleAlerts.map((alert, index) => (
              <p key={index} className="text-xs text-warning/80">
                {alert.text}
                <UpdatedStamp date={alert.updated} className="ml-2" />
              </p>
            ))}
          </div>
        )}

        {/* Long Tips */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-sm font-semibold text-success">LONG {selectedAsset.symbol}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {longSummary.met} de {longSummary.total} condições ativas
              {longSummary.manual > 0 && ` · ${longSummary.manual} manuais`}
            </span>
          </div>
          <div className="bg-success/5 border border-success/20 rounded-lg p-3">
            <ConditionList items={longConds} tone="long" />
          </div>
        </div>

        {/* Short Tips */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <TrendingDown className="h-4 w-4 text-destructive" />
            <span className="text-sm font-semibold text-destructive">SHORT {selectedAsset.symbol}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {shortSummary.met} de {shortSummary.total} condições ativas
              {shortSummary.manual > 0 && ` · ${shortSummary.manual} manuais`}
            </span>
          </div>
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
            <ConditionList items={shortConds} tone="short" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

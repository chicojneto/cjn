import { useState } from 'react';
import { TrendingUp, TrendingDown, ChevronDown, DollarSign, Coins, BarChart3, Fuel, Flame, AlertTriangle } from 'lucide-react';
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
  alerts?: string[];
}

const assetTips: AssetTip[] = [
  {
    id: 'xauusd',
    symbol: 'XAU/USD',
    name: 'Ouro',
    icon: Coins,
    category: 'commodities',
    long: [
      'DXY caindo (correlação enfraquecida: -0.45 vs histórico -0.8)',
      'VIX subindo (correlação +0.5 a +0.6 em crises)',
      'Yields caindo (correlação QUEBRADA em períodos)',
      'Tensão geopolítica (IRÃ = fator #1 agora)',
      'Fed dovish ou perdendo independência',
      '[NOVO] Bancos centrais comprando ouro como reserva (recorde)',
      '[NOVO] Term premium subindo = policy mismatch'
    ],
    short: [
      'DXY subindo forte',
      'VIX baixo + mercado calmo',
      'Fed hawkish + yields reais subindo',
      'Profit-taking após rally',
      '[NOVO] Stock-bond correlation em máxima 30 anos'
    ],
    alerts: [
      '⚠️ STOP OBRIGATÓRIO: Ouro pode crashar 10-20% em DIAS (Jan/26: $5.500→$4.500 em 48h)',
      'Zona de buy-the-dip estrutural: $3.500-$3.700 (State Street/WGC)',
      'NÃO trate como posição segura. Tail risk brutal.'
    ]
  },
  {
    id: 'eurusd',
    symbol: 'EUR/USD',
    name: 'Euro/Dólar',
    icon: DollarSign,
    category: 'forex',
    long: [
      'DXY caindo (correlação -0.97, praticamente inverso)',
      'ECB menos dovish que Fed',
      'Dados fortes da Zona Euro',
      '[NOVO] Estímulo fiscal europeu EUR 500bi',
      'Yields alemães subindo mais que dos EUA'
    ],
    short: [
      'DXY repricando para cima',
      'Dados EUA fortes (NFP, CPI)',
      'Fed hawkish surpresa',
      '[NOVO] Escalada Irã (flight to USD temporário)'
    ],
    alerts: [
      'EUR/USD próximo de 1.1900-1.2000, máximas de 3 anos',
      'Resistência Fibonacci em jogo',
      'GBP/USD mostra tendência mais limpa para trade de dólar fraco'
    ]
  },
  {
    id: 'gbpusd',
    symbol: 'GBP/USD',
    name: 'Libra/Dólar',
    icon: DollarSign,
    category: 'forex',
    long: [
      'DXY fraco (correlação -0.85)',
      'BOE hawkish relativo (cortando mais devagar que Fed)',
      'Inflação UK alta/persistente',
      'EUR/GBP caindo (GBP forte)',
      '[NOVO] PAR PREFERIDO para trade de dólar fraco em 2026'
    ],
    short: [
      'DXY forte',
      'BOE dovish surpresa',
      '[NOVO] Crise fiscal UK (cortes de gastos março)',
      'Risk-off extremo'
    ],
    alerts: [
      'Forecasts bancos: GBP/USD 1.36-1.40 em 2026',
      'Testando 1.3500 como resistência',
      'Tendência mais limpa que EUR/USD para dólar fraco'
    ]
  },
  {
    id: 'usdjpy',
    symbol: 'USD/JPY',
    name: 'Dólar/Iene',
    icon: DollarSign,
    category: 'forex',
    long: [
      'Yields EUA subindo (correlação +0.9)',
      'Risk-on forte',
      'BOJ dovish surpresa',
      'Carry trade atrativo',
      'Nikkei subindo (correlação positiva)'
    ],
    short: [
      'Risk-off + VIX disparando',
      'BOJ hawkish (esperado +50bps em 2026)',
      'Carry unwind sistêmico',
      'Intervenção japonesa (nível 160 = linha vermelha)',
      '[NOVO] Diferencial convergindo: Fed cortando + BOJ subindo'
    ],
    alerts: [
      '⚠️ ALERTA: Se USD/JPY romper 140 com velocidade = LIQUIDAR posições de risco',
      'USD/JPY é 13.6% do DXY. Se carry unwind = DXY desmorona junto',
      'RISCO DE UNWIND SISTÊMICO - maior carry trade do mundo'
    ]
  },
  {
    id: 'audusd',
    symbol: 'AUD/USD',
    name: 'Dólar Australiano',
    icon: DollarSign,
    category: 'forex',
    long: [
      'Risk-on forte',
      'Commodities subindo',
      'China forte (HK50 subindo)',
      'DXY caindo',
      '[NOVO] China anunciou estímulos - monitorar PMIs mensalmente'
    ],
    short: [
      'Risk-off',
      'Commodities caindo',
      'China fraca',
      'DXY forte',
      'VIX alto'
    ],
    alerts: [
      'Correlação +0.9 com NZD/USD',
      'AUD geralmente preferível (mais liquidez)'
    ]
  },
  {
    id: 'usdcad',
    symbol: 'USD/CAD',
    name: 'Dólar/Canadense',
    icon: DollarSign,
    category: 'forex',
    long: [
      'Petróleo caindo forte',
      'DXY subindo',
      'BOC dovish',
      'Fed hawkish'
    ],
    short: [
      'Petróleo subindo forte',
      'DXY caindo',
      'BOC hawkish',
      'Risk-on',
      '[NOVO] Se tensões Irã escalarem = petróleo dispara = CAD forte = USD/CAD cai forte'
    ]
  },
  {
    id: 'usdchf',
    symbol: 'USD/CHF',
    name: 'Dólar/Franco Suíço',
    icon: DollarSign,
    category: 'forex',
    long: [
      'Risk-on forte',
      'VIX baixo',
      'DXY forte',
      'Ações subindo'
    ],
    short: [
      'Risk-off',
      'Crise global',
      'VIX alto',
      'Busca por segurança',
      '[NOVO] Se Irã escalar = CHF fortalece junto com JPY e ouro'
    ]
  },
  {
    id: 'spx',
    symbol: 'S&P 500',
    name: 'S&P 500',
    icon: BarChart3,
    category: 'indices',
    long: [
      'DXY caindo (favorece exportações)',
      'VIX < 15',
      'Dados econômicos fortes',
      'Fed dovish/neutro',
      'Earnings positivos',
      'Market breadth expandindo',
      '[NOVO] HYG/JNK estável (crédito saudável)'
    ],
    short: [
      'DXY subindo forte',
      'VIX > 25',
      'Dados fracos',
      'Fed muito hawkish',
      '[NOVO] AI repricing (Mag-7 = 30% do índice)',
      '[NOVO] Market breadth contraindo',
      '[NOVO] JOLTS colapsando (<6M = recessão)',
      '[NOVO] HY spreads subindo (>4% = stress)'
    ],
    alerts: [
      'CONCENTRAÇÃO EXTREMA: 6 ações AI = 30% do S&P 500',
      'BTC = canário - se BTC cair >10%, NQ/S&P seguem'
    ]
  },
  {
    id: 'nasdaq',
    symbol: 'NASDAQ',
    name: 'Nasdaq Composite',
    icon: BarChart3,
    category: 'indices',
    long: [
      'DXY caindo (techs se beneficiam muito)',
      'VIX baixo',
      'Yields caindo (favorece growth stocks)',
      'Fed dovish',
      'Earnings de tech positivos',
      '[NOVO] Rotação setorial estabiliza'
    ],
    short: [
      'DXY subindo forte (40% receita vem de fora EUA)',
      'VIX alto',
      'Yields subindo (pressiona valuations)',
      'Fed muito hawkish',
      '[NOVO] AI CAPEX SELLOFF em curso',
      '[NOVO] Alphabet $185bi + Amazon $200bi = repricing',
      '[NOVO] Rotação para staples, utilities, telecom'
    ],
    alerts: [
      'NASDAQ: 22.540 - caiu 4% na semana (pior sequência desde abril)',
      'Negativo no ano (-3%)',
      'BTC em $63k no selloff - altamente correlacionado'
    ]
  },
  {
    id: 'win',
    symbol: 'WIN1!',
    name: 'Ibovespa Futuro',
    icon: BarChart3,
    category: 'indices',
    long: [
      'S&P 500 subindo',
      'Commodities fortes (petróleo, minério)',
      'Real forte',
      'Fluxo gringo entrando',
      'Selic caindo',
      '[NOVO] IPCA-15 desacelerando = espaço cortes',
      '[NOVO] EWZ (ETF Brasil NY) subindo no pré-mercado'
    ],
    short: [
      'Risk-off global',
      'AI selloff seca fluxo',
      'Crise política Brasil',
      'DXY disparando',
      '[NOVO] Eleições 2026 provocando saída de fluxo'
    ],
    alerts: [
      'Ibovespa ~182.695 pts - fluxo estrangeiro massivo',
      'RISCO: Selloff tech/AI nos EUA seca fluxo global'
    ]
  },
  {
    id: 'wdo',
    symbol: 'WDO1!',
    name: 'Dólar Futuro',
    icon: DollarSign,
    category: 'indices',
    long: [
      'DXY forte (correlação +0.9)',
      'Risk-off global',
      'Commodities fracas',
      'Crise política Brasil',
      '[NOVO] Irã escala = dólar sobe contra TODAS moedas EM'
    ],
    short: [
      'DXY fraco',
      'Risk-on',
      'Commodities fortes',
      'S&P subindo',
      'Selic alta + Fed cortando = diferencial',
      '[NOVO] Fluxo gringo massivo para Brasil'
    ],
    alerts: [
      'Dólar/Real: R$5.20-5.30 (menor em 2 anos)',
      'PTAX: dias 29/30/último útil = distorções',
      'Cupom cambial (DDI-DI) = indicador real de pressão'
    ]
  },
  {
    id: 'oil',
    symbol: 'CL1!',
    name: 'Petróleo WTI',
    icon: Fuel,
    category: 'commodities',
    long: [
      '[NOVO] TENSÕES IRÃ = FATOR #1 AGORA',
      'OPEC+ cortando produção',
      'China forte',
      'Estoques caindo',
      'Polymarket: 55% chance ataque até junho'
    ],
    short: [
      'Negociações Irã avançam',
      'OPEC+ aumentando produção',
      'Recessão iminente',
      'Estoques subindo forte',
      'China fraca'
    ],
    alerts: [
      'Armada naval EUA posicionada + negociações Omã',
      'Se probabilidade >40%: ajustar CAD, BRL, energia',
      'Preços esperados em queda SEM evento geopolítico'
    ]
  },
  {
    id: 'natgas',
    symbol: 'NG1!',
    name: 'Gás Natural',
    icon: Flame,
    category: 'commodities',
    long: [
      'Previsão de inverno rigoroso',
      'Estoques baixos',
      'Crise na Europa',
      'Produção caindo'
    ],
    short: [
      'Inverno ameno previsto',
      'Estoques altos',
      'Produção recordes',
      'Demanda fraca'
    ]
  }
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

        {/* Alerts Section */}
        {selectedAsset.alerts && selectedAsset.alerts.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400">ALERTAS</span>
            </div>
            {selectedAsset.alerts.map((alert, index) => (
              <p key={index} className="text-xs text-amber-300/80">
                {alert}
              </p>
            ))}
          </div>
        )}

        {/* Long Tips */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm font-semibold text-green-500">LONG {selectedAsset.symbol}</span>
          </div>
          <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
            <ul className="space-y-1">
              {selectedAsset.long.map((tip, index) => (
                <li key={index} className={`text-sm flex items-start gap-2 ${tip.startsWith('[NOVO]') ? 'text-amber-400' : 'text-muted-foreground'}`}>
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
                <li key={index} className={`text-sm flex items-start gap-2 ${tip.startsWith('[NOVO]') ? 'text-amber-400' : 'text-muted-foreground'}`}>
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

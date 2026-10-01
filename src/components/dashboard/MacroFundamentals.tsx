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
  GraduationCap, 
  ChevronDown, 
  DollarSign,
  Activity,
  TrendingUp,
  Flame,
  Landmark,
  BarChart3,
  Shield,
  Percent,
  LineChart,
  Globe2,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

const fundamentals = [
  {
    id: 'juro-real',
    title: 'Juro real (DFII10)',
    icon: Percent,
    color: 'text-success',
    bgColor: 'bg-success/20',
    description: 'Conteúdo a ser preenchido.',
    keyPoints: ['Conteúdo a ser preenchido.']
  },
  {
    id: 'curva-di',
    title: 'Curva DI',
    icon: LineChart,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/20',
    description: 'Conteúdo a ser preenchido.',
    keyPoints: ['Conteúdo a ser preenchido.']
  },
  {
    id: 'fluxo-ewz',
    title: 'Fluxo estrangeiro / EWZ',
    icon: Globe2,
    color: 'text-success',
    bgColor: 'bg-success/20',
    description: 'Conteúdo a ser preenchido.',
    keyPoints: ['Conteúdo a ser preenchido.']
  },
  {
    id: 'gex',
    title: 'Posicionamento de opções (GEX)',
    icon: Layers,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/20',
    description: 'Conteúdo a ser preenchido.',
    keyPoints: ['Conteúdo a ser preenchido.']
  },
  {
    id: 'dxy',
    title: 'DXY (Índice do Dólar)',
    icon: DollarSign,
    color: 'text-success',
    bgColor: 'bg-success/20',
    description: 'Mede a força do USD contra uma cesta de 6 moedas (EUR, JPY, GBP, CAD, SEK, CHF). É o indicador mais importante para forex e commodities.',
    keyPoints: [
      'USD forte = commodities mais fracas (inversamente correlacionado)',
      'Afeta diretamente todos os pares de moedas com USD',
      'Principal referência para traders de forex',
      'Sobe em momentos de aversão ao risco global'
    ]
  },
  {
    id: 'vix',
    title: 'VIX (Índice de Volatilidade)',
    icon: Activity,
    color: 'text-destructive',
    bgColor: 'bg-destructive/20',
    description: 'Conhecido como "índice do medo". Mede a volatilidade esperada do S&P 500.',
    keyPoints: [
      'VIX alto (> 25) = aversão ao risco = fuga para ativos seguros (USD, JPY, Ouro)',
      'VIX baixo (< 15) = apetite por risco = força em ações e moedas de risco (AUD, NZD)',
      'Inversamente correlacionado com S&P 500',
      'Spikes no VIX geralmente indicam pânico no mercado'
    ]
  },
  {
    id: 'yields',
    title: 'Yields dos Treasuries',
    icon: TrendingUp,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/20',
    description: 'Títulos do Tesouro dos EUA, especialmente o 10Y (10 anos). Fundamentais para entender fluxos de capital.',
    keyPoints: [
      'Yields subindo = USD mais forte, ações podem cair',
      'Diferencial de yields entre países influencia forex',
      'Ex: yields EUA vs Alemanha afeta EUR/USD diretamente',
      'Curva de yields invertida pode sinalizar recessão'
    ]
  },
  {
    id: 'oil',
    title: 'Petróleo (WTI/Brent)',
    icon: Flame,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/20',
    description: 'Commodity mais importante do mundo. Impacta diretamente moedas de países produtores e inflação global.',
    keyPoints: [
      'Impacta diretamente CAD, NOK, RUB',
      'Petróleo subindo = CAD mais forte',
      'Afeta inflação global e decisões de bancos centrais',
      'Correlacionado com crescimento econômico global'
    ]
  },
  {
    id: 'central-banks',
    title: 'Política Monetária',
    icon: Landmark,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/20',
    description: 'Decisões dos principais Bancos Centrais: Fed (EUA), ECB (Europa), BOJ (Japão), BOE (Reino Unido).',
    keyPoints: [
      'Decisões de juros são os eventos mais importantes do mercado',
      'Juros mais altos = moeda mais forte (geralmente)',
      'Forward guidance afeta expectativas futuras',
      'Divergência entre BCs cria tendências de longo prazo'
    ]
  },
  {
    id: 'economic-data',
    title: 'Dados Econômicos',
    icon: BarChart3,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/20',
    description: 'Indicadores que medem a saúde da economia e influenciam decisões de política monetária.',
    keyPoints: [
      'NFP (folha de pagamento não-agrícola dos EUA) - mais importante',
      'CPI (inflação) - define política do Fed',
      'PIB - crescimento econômico geral',
      'PMI (índice de gerentes de compras) - indicador antecedente',
      'Dados melhores que esperado = moeda mais forte'
    ]
  },
  {
    id: 'risk-sentiment',
    title: 'Sentimento de Risco',
    icon: Shield,
    color: 'text-warning',
    bgColor: 'bg-warning/20',
    description: 'Risk-On vs Risk-Off define o comportamento geral dos mercados e correlações entre ativos.',
    keyPoints: [
      'Risk-On: investidores buscam retorno',
      '→ Ações sobem, AUD/NZD/CAD sobem, VIX cai',
      'Risk-Off: investidores buscam segurança',
      '→ USD/JPY/CHF sobem, ouro sobe, ações caem'
    ]
  }
];

export function MacroFundamentals() {
  const [selectedFundamental, setSelectedFundamental] = useState(fundamentals[0]);

  const SelectedIcon = selectedFundamental.icon;

  return (
    <Card className="border-border/30 bg-card/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Fundamentos Macroeconômicos
          </CardTitle>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 bg-secondary/50">
                <SelectedIcon className={cn('h-4 w-4', selectedFundamental.color)} />
                <span className="hidden sm:inline text-sm">{selectedFundamental.title}</span>
                <span className="sm:hidden text-sm">{selectedFundamental.id.toUpperCase()}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-background border-border">
              {fundamentals.map((fundamental) => {
                const Icon = fundamental.icon;
                return (
                  <DropdownMenuItem
                    key={fundamental.id}
                    onClick={() => setSelectedFundamental(fundamental)}
                    className={cn(
                      'gap-3 cursor-pointer',
                      selectedFundamental.id === fundamental.id && 'bg-secondary'
                    )}
                  >
                    <div className={cn('p-1.5 rounded-md', fundamental.bgColor)}>
                      <Icon className={cn('h-4 w-4', fundamental.color)} />
                    </div>
                    <span className="text-sm">{fundamental.title}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className={cn(
          'p-4 rounded-lg border mb-4',
          selectedFundamental.bgColor,
          'border-border/50'
        )}>
          <div className="flex items-center gap-2 mb-3">
            <SelectedIcon className={cn('h-5 w-5', selectedFundamental.color)} />
            <h3 className="font-semibold">{selectedFundamental.title}</h3>
            <Badge variant="secondary" className="text-[10px] font-mono uppercase">
              {selectedFundamental.id}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {selectedFundamental.description}
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Pontos-Chave
          </h4>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2 pr-4">
              {selectedFundamental.keyPoints.map((point, index) => (
                <div 
                  key={index}
                  className={cn(
                    'p-3 rounded-lg border transition-colors duration-150',
                    point.startsWith('→') 
                      ? 'bg-primary/10 border-primary/30 pl-6' 
                      : 'bg-secondary/30 border-border/30'
                  )}
                >
                  <p className={cn(
                    'text-sm',
                    point.startsWith('→') && 'text-primary font-medium'
                  )}>
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

import { useAssets, useAssetCorrelations } from '@/hooks/useAssets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CorrelationsPanelProps {
  selectedAsset: string | null;
  onAssetSelect: (assetId: string | null) => void;
}

const correlationTypeConfig = {
  positive: { 
    icon: TrendingUp, 
    color: 'text-success',
    arrow: ArrowUpRight,
    label: 'Positiva'
  },
  negative: { 
    icon: TrendingDown, 
    color: 'text-destructive',
    arrow: ArrowDownRight,
    label: 'Negativa'
  },
  neutral: { 
    icon: Minus, 
    color: 'text-muted-foreground',
    arrow: Activity,
    label: 'Neutra'
  },
};

const strengthConfig = {
  very_high: { label: 'Muito Alta', color: 'bg-primary/30 text-primary border-primary/50' },
  high: { label: 'Alta', color: 'bg-success/20 text-success border-success/50' },
  medium: { label: 'Média', color: 'bg-warning/20 text-warning border-warning/50' },
  low: { label: 'Baixa', color: 'bg-muted text-muted-foreground border-muted' },
};

// Dados estáticos das correlações com base no que o usuário informou
const staticCorrelations: Record<string, Array<{
  indicator: string;
  category: string;
  correlation: 'positive' | 'negative' | 'neutral';
  strength: 'low' | 'medium' | 'high' | 'very_high';
  description: string;
}>> = {
  'XAU/USD': [
    { indicator: 'CPI/PCE (Inflação)', category: 'Inflação', correlation: 'positive', strength: 'high', description: 'Ouro é hedge contra inflação. Inflação subindo = ouro sobe.' },
    { indicator: 'Fed Rate (Juros)', category: 'Juros', correlation: 'negative', strength: 'very_high', description: 'Juros subindo = ouro cai. Juros caindo = ouro sobe.' },
    { indicator: 'Tensões Geopolíticas', category: 'Risco', correlation: 'positive', strength: 'high', description: 'Guerras, crises = fuga para ouro.' },
    { indicator: 'DXY (Dólar)', category: 'Moedas', correlation: 'negative', strength: 'high', description: 'Dólar forte = ouro mais caro em outras moedas.' },
  ],
  'EUR/USD': [
    { indicator: 'Diferencial Fed/ECB', category: 'Juros', correlation: 'negative', strength: 'very_high', description: 'Fed sobe juros mais que ECB = EUR/USD cai.' },
    { indicator: 'NFP (Emprego EUA)', category: 'Emprego', correlation: 'negative', strength: 'high', description: 'NFP forte = USD forte = EUR/USD cai.' },
    { indicator: 'CPI EUA', category: 'Inflação', correlation: 'negative', strength: 'high', description: 'CPI alto = USD forte = EUR/USD cai.' },
    { indicator: 'PMI Zona Euro', category: 'Atividade', correlation: 'positive', strength: 'medium', description: 'Dados fortes na Europa = EUR sobe.' },
    { indicator: 'Sentimento de Risco', category: 'Risco', correlation: 'neutral', strength: 'medium', description: 'Risk-off moderado tende a favorecer USD.' },
  ],
  'GBP/USD': [
    { indicator: 'Diferencial Fed/BoE', category: 'Juros', correlation: 'negative', strength: 'very_high', description: 'Fed mais hawkish que BoE = GBP/USD cai.' },
    { indicator: 'NFP (Emprego EUA)', category: 'Emprego', correlation: 'negative', strength: 'high', description: 'NFP forte = USD forte = GBP/USD cai.' },
    { indicator: 'PMI UK', category: 'Atividade', correlation: 'positive', strength: 'medium', description: 'Dados fortes no UK = GBP sobe.' },
  ],
  'USD/JPY': [
    { indicator: 'Diferencial Fed/BOJ', category: 'Juros', correlation: 'positive', strength: 'very_high', description: 'Fed subindo + BOJ mantendo = USD/JPY sobe forte.' },
    { indicator: 'US 10Y Yield', category: 'Títulos', correlation: 'positive', strength: 'very_high', description: 'Correlação +0.9. Yields subindo = USD/JPY sobe.' },
    { indicator: 'Sentimento de Risco', category: 'Risco', correlation: 'negative', strength: 'high', description: 'Risk-off = JPY forte (safe haven) = USD/JPY cai.' },
  ],
  'USD/CAD': [
    { indicator: 'Diferencial Fed/BOC', category: 'Juros', correlation: 'positive', strength: 'very_high', description: 'Fed vs BOC determina a direção.' },
    { indicator: 'Petróleo', category: 'Commodities', correlation: 'negative', strength: 'high', description: 'Canadá exporta petróleo. Petróleo subindo = CAD forte = USD/CAD cai.' },
  ],
  'WIN1!': [
    { indicator: 'Commodities', category: 'Commodities', correlation: 'positive', strength: 'high', description: 'Brasil exporta commodities. Preços subindo = bom para Ibovespa.' },
    { indicator: 'Petróleo', category: 'Commodities', correlation: 'positive', strength: 'high', description: 'Petrobras tem peso grande. Petróleo subindo = WIN sobe.' },
    { indicator: 'HK50 (China)', category: 'Índices', correlation: 'positive', strength: 'medium', description: 'China forte = bom para Brasil = WIN sobe.' },
    { indicator: 'Sentimento de Risco', category: 'Risco', correlation: 'positive', strength: 'high', description: 'Risk-on global = WIN sobe. Risk-off = WIN cai.' },
    { indicator: 'Política Brasil', category: 'Político', correlation: 'positive', strength: 'medium', description: 'Estabilidade política e fiscal no Brasil.' },
    { indicator: 'Selic', category: 'Juros', correlation: 'negative', strength: 'medium', description: 'Juros altos demais podem ser negativos para ações.' },
    { indicator: 'Real (BRL)', category: 'Moedas', correlation: 'positive', strength: 'medium', description: 'Real forte = bom para WIN (fluxo estrangeiro).' },
  ],
  'WDO1!': [
    { indicator: 'Commodities', category: 'Commodities', correlation: 'negative', strength: 'high', description: 'Commodities fortes = BRL forte = WDO cai.' },
    { indicator: 'S&P 500', category: 'Índices', correlation: 'negative', strength: 'high', description: 'Ações globais subindo = risk-on = BRL forte = WDO cai.' },
    { indicator: 'Diferencial Selic/Fed', category: 'Juros', correlation: 'negative', strength: 'very_high', description: 'Selic alta + Fed baixando = BRL forte = WDO cai.' },
    { indicator: 'Política Brasil', category: 'Político', correlation: 'positive', strength: 'high', description: 'Crise = fuga de capital = WDO sobe.' },
    { indicator: 'Balança Comercial', category: 'Economia', correlation: 'negative', strength: 'medium', description: 'Superávit forte = BRL forte = WDO cai.' },
    { indicator: 'Fluxo Cambial', category: 'Fluxo', correlation: 'negative', strength: 'high', description: 'Entrada de dólares no Brasil = WDO cai.' },
  ],
};

export function CorrelationsPanel({ selectedAsset, onAssetSelect }: CorrelationsPanelProps) {
  const { data: assets, isLoading: loadingAssets } = useAssets();
  
  const selectedAssetData = assets?.find(a => a.id === selectedAsset);
  const correlations = selectedAssetData ? staticCorrelations[selectedAssetData.symbol] : null;

  if (loadingAssets) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Correlações & Fatores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Correlações & Fatores
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Select 
            value={selectedAsset || ''} 
            onValueChange={(value) => onAssetSelect(value || null)}
          >
            <SelectTrigger className="w-full bg-secondary/50">
              <SelectValue placeholder="Selecione um ativo para ver as correlações" />
            </SelectTrigger>
            <SelectContent>
              {assets?.map((asset) => (
                <SelectItem key={asset.id} value={asset.id}>
                  <span className="font-mono">{asset.symbol}</span>
                  <span className="text-muted-foreground ml-2">- {asset.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!selectedAsset ? (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Selecione um ativo acima</p>
            <p className="text-sm mt-1">para ver os fatores que influenciam seu preço</p>
          </div>
        ) : !correlations ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Correlações não definidas para este ativo</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-3 pr-4">
              {correlations.map((corr, idx) => {
                const typeConfig = correlationTypeConfig[corr.correlation];
                const TypeIcon = typeConfig.icon;
                const ArrowIcon = typeConfig.arrow;
                const strength = strengthConfig[corr.strength];
                
                return (
                  <div 
                    key={idx}
                    className="p-4 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'p-2 rounded-lg shrink-0',
                        corr.correlation === 'positive' && 'bg-success/20',
                        corr.correlation === 'negative' && 'bg-destructive/20',
                        corr.correlation === 'neutral' && 'bg-muted'
                      )}>
                        <TypeIcon className={cn('h-5 w-5', typeConfig.color)} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h4 className="font-medium text-sm">{corr.indicator}</h4>
                          <ArrowIcon className={cn('h-4 w-4', typeConfig.color)} />
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-[10px]">
                            {corr.category}
                          </Badge>
                          <Badge variant="outline" className={cn('text-[10px]', strength.color)}>
                            {strength.label}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              'text-[10px]',
                              corr.correlation === 'positive' && 'border-success/50 text-success',
                              corr.correlation === 'negative' && 'border-destructive/50 text-destructive',
                              corr.correlation === 'neutral' && 'border-muted'
                            )}
                          >
                            {typeConfig.label}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          {corr.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calculator, TrendingUp, TrendingDown, Minus, Clock, Target, AlertTriangle } from 'lucide-react';

interface CalculatedLevels {
  ptaxPoints: number;
  rangeD1: number;
  mediaD1: number;
  rangeEsperado: number;
  variacaoAbertura: number;
  resistencia2: number;
  resistencia1: number;
  resistenciaRange: number;
  suporteRange: number;
  suporte1: number;
  suporte2: number;
  bias: 'bullish' | 'bearish' | 'neutral';
  biasText: string;
}

interface StrategicSchedule {
  time: string;
  event: string;
  strategy: string;
}

const strategicSchedule: StrategicSchedule[] = [
  { time: '09:00', event: 'Abertura WDO', strategy: 'Alta volatilidade - aguardar 15min' },
  { time: '10:00', event: 'Abertura Casado', strategy: 'Define tom do dia' },
  { time: '12:00', event: 'PTAX Parcial', strategy: 'Início da convergência' },
  { time: '12:30', event: 'Janela Convergência', strategy: 'Melhor momento para trades' },
  { time: '13:00', event: 'PTAX Final', strategy: 'Evitar abrir posições novas' },
  { time: '17:55', event: 'Fechamento WDO', strategy: 'Reduzir exposição' },
];

export function WDOCalculator() {
  // Input values
  const [ptaxAnterior, setPtaxAnterior] = useState<number>(6.185);
  const [maximaD1, setMaximaD1] = useState<number>(6225);
  const [minimaD1, setMinimaD1] = useState<number>(6145);
  const [aberturaHoje, setAberturaHoje] = useState<number>(6180);
  const [volatilidade, setVolatilidade] = useState<number>(0.8);

  // Calculated values
  const [levels, setLevels] = useState<CalculatedLevels | null>(null);

  // Calculate all levels when inputs change
  useEffect(() => {
    calculateLevels();
  }, [ptaxAnterior, maximaD1, minimaD1, aberturaHoje, volatilidade]);

  const calculateLevels = () => {
    // PTAX in points (multiply by 1000 for WDO)
    const ptaxPoints = ptaxAnterior * 1000;
    
    // Range D-1 (Max - Min)
    const rangeD1 = maximaD1 - minimaD1;
    
    // Average D-1
    const mediaD1 = (maximaD1 + minimaD1) / 2;
    
    // Expected range based on volatility
    const rangeEsperado = ptaxPoints * (volatilidade / 100);
    
    // Variation opening vs PTAX
    const variacaoAbertura = ((aberturaHoje - ptaxPoints) / ptaxPoints) * 100;
    
    // Resistance and Support levels
    const resistencia2 = ptaxPoints * 1.01; // +1%
    const resistencia1 = ptaxPoints * 1.005; // +0.5%
    const resistenciaRange = ptaxPoints + (ptaxPoints * (volatilidade / 100));
    const suporteRange = ptaxPoints - (ptaxPoints * (volatilidade / 100));
    const suporte1 = ptaxPoints * 0.995; // -0.5%
    const suporte2 = ptaxPoints * 0.99; // -1%

    // Determine bias
    let bias: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let biasText = 'NEUTRO/LATERAL';
    
    if (variacaoAbertura > 0.3) {
      bias = 'bullish';
      biasText = 'ALTA - Abertura acima da PTAX';
    } else if (variacaoAbertura < -0.3) {
      bias = 'bearish';
      biasText = 'BAIXA - Abertura abaixo da PTAX';
    } else {
      bias = 'neutral';
      biasText = 'NEUTRO/LATERAL';
    }

    setLevels({
      ptaxPoints,
      rangeD1,
      mediaD1,
      rangeEsperado,
      variacaoAbertura,
      resistencia2,
      resistencia1,
      resistenciaRange,
      suporteRange,
      suporte1,
      suporte2,
      bias,
      biasText,
    });
  };

  const BiasIcon = levels?.bias === 'bullish' ? TrendingUp : 
                   levels?.bias === 'bearish' ? TrendingDown : Minus;
  
  const biasColor = levels?.bias === 'bullish' ? 'text-emerald-400' : 
                    levels?.bias === 'bearish' ? 'text-red-400' : 'text-yellow-400';

  const biasBackground = levels?.bias === 'bullish' ? 'bg-emerald-500/20 border-emerald-500/50' : 
                         levels?.bias === 'bearish' ? 'bg-red-500/20 border-red-500/50' : 
                         'bg-yellow-500/20 border-yellow-500/50';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left Column: Calculator */}
      <Card className="border-border/50 bg-background">
        <CardHeader className="py-2 px-3 border-b border-border/50 bg-blue-500/10">
          <CardTitle className="text-sm font-mono font-bold flex items-center gap-2 text-blue-400">
            <Calculator className="h-4 w-4" />
            CALCULADORA WDO - PTAX
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-4">
          {/* Input Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              📊 DADOS DE ENTRADA
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">PTAX D-1 (R$)</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={ptaxAnterior}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setPtaxAnterior(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                  className="h-8 text-sm font-mono bg-yellow-500/10 border-yellow-500/30"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Volatilidade (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="1.5"
                  value={volatilidade}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setVolatilidade(e.target.value === '' ? 0.8 : parseFloat(e.target.value))}
                  className="h-8 text-sm font-mono bg-yellow-500/10 border-yellow-500/30"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Máxima WDO D-1</Label>
                <Input
                  type="number"
                  value={maximaD1}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setMaximaD1(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                  className="h-8 text-sm font-mono bg-yellow-500/10 border-yellow-500/30"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Mínima WDO D-1</Label>
                <Input
                  type="number"
                  value={minimaD1}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setMinimaD1(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                  className="h-8 text-sm font-mono bg-yellow-500/10 border-yellow-500/30"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs text-muted-foreground">Abertura WDO Hoje</Label>
                <Input
                  type="number"
                  value={aberturaHoje}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setAberturaHoje(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                  className="h-8 text-sm font-mono bg-yellow-500/10 border-yellow-500/30"
                />
              </div>
            </div>
          </div>

          {/* Calculated Values */}
          {levels && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                🔢 CÁLCULOS AUTOMÁTICOS
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="flex justify-between p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground">PTAX Pontos:</span>
                  <span className="font-bold text-foreground">{levels.ptaxPoints.toFixed(0)}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground">Range D-1:</span>
                  <span className="font-bold text-foreground">{levels.rangeD1.toFixed(0)}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground">Média D-1:</span>
                  <span className="font-bold text-foreground">{levels.mediaD1.toFixed(0)}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground">Range Esperado:</span>
                  <span className="font-bold text-foreground">{levels.rangeEsperado.toFixed(2)}</span>
                </div>
              </div>

              {/* Bias Indicator */}
              <div className={`flex items-center gap-3 p-3 border rounded ${biasBackground}`}>
                <BiasIcon className={`h-5 w-5 ${biasColor}`} />
                <div>
                  <span className={`font-bold font-mono ${biasColor}`}>
                    Variação: {levels.variacaoAbertura.toFixed(2)}%
                  </span>
                  <p className={`text-xs ${biasColor}`}>{levels.biasText}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right Column: Levels & Schedule */}
      <div className="space-y-4">
        {/* Operational Levels */}
        {levels && (
          <Card className="border-border/50 bg-background">
            <CardHeader className="py-2 px-3 border-b border-border/50 bg-amber-500/10">
              <CardTitle className="text-sm font-mono font-bold flex items-center gap-2 text-amber-400">
                <Target className="h-4 w-4" />
                ALVOS E NÍVEIS OPERACIONAIS
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/30 text-xs font-mono">
                {/* Resistances */}
                <div className="flex justify-between items-center p-2 bg-red-500/10 hover:bg-red-500/20 transition-colors">
                  <span className="text-red-400">R2 (+1%)</span>
                  <span className="font-bold text-red-400">{levels.resistencia2.toFixed(2)}</span>
                  <span className="text-[10px] text-muted-foreground">Alvo forte venda</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-red-500/5 hover:bg-red-500/10 transition-colors">
                  <span className="text-red-300">R1 (+0.5%)</span>
                  <span className="font-bold text-red-300">{levels.resistencia1.toFixed(2)}</span>
                  <span className="text-[10px] text-muted-foreground">Primeiro alvo venda</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-red-500/5 hover:bg-red-500/10 transition-colors">
                  <span className="text-orange-400">R Range</span>
                  <span className="font-bold text-orange-400">{levels.resistenciaRange.toFixed(2)}</span>
                  <span className="text-[10px] text-muted-foreground">Baseado volatilidade</span>
                </div>

                {/* PTAX Pivot */}
                <div className="flex justify-between items-center p-3 bg-blue-500/20 hover:bg-blue-500/30 transition-colors">
                  <span className="text-blue-400 font-bold">PTAX (Pivô)</span>
                  <span className="font-bold text-lg text-blue-400">{levels.ptaxPoints.toFixed(0)}</span>
                  <span className="text-[10px] text-blue-300">Referência principal</span>
                </div>

                {/* Supports */}
                <div className="flex justify-between items-center p-2 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors">
                  <span className="text-emerald-300">S Range</span>
                  <span className="font-bold text-emerald-300">{levels.suporteRange.toFixed(2)}</span>
                  <span className="text-[10px] text-muted-foreground">Baseado volatilidade</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors">
                  <span className="text-emerald-400">S1 (-0.5%)</span>
                  <span className="font-bold text-emerald-400">{levels.suporte1.toFixed(2)}</span>
                  <span className="text-[10px] text-muted-foreground">Primeiro alvo compra</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors">
                  <span className="text-emerald-500">S2 (-1%)</span>
                  <span className="font-bold text-emerald-500">{levels.suporte2.toFixed(2)}</span>
                  <span className="text-[10px] text-muted-foreground">Alvo forte compra</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Strategic Schedule */}
        <Card className="border-border/50 bg-background">
          <CardHeader className="py-2 px-3 border-b border-border/50 bg-purple-500/10">
            <CardTitle className="text-sm font-mono font-bold flex items-center gap-2 text-purple-400">
              <Clock className="h-4 w-4" />
              HORÁRIOS ESTRATÉGICOS
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/30 text-xs font-mono">
              {strategicSchedule.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 hover:bg-muted/20 transition-colors">
                  <span className="text-purple-400 font-bold min-w-[50px]">{item.time}</span>
                  <span className="text-foreground font-medium min-w-[100px]">{item.event}</span>
                  <span className="text-[10px] text-muted-foreground flex-1">{item.strategy}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Warning */}
        <div className="flex items-start gap-2 p-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="font-mono">Esta calculadora é uma ferramenta de apoio. Use sempre stop loss e gerencie seu risco.</p>
        </div>
      </div>
    </div>
  );
}

import { motion } from 'framer-motion';
import { Activity, Thermometer, Landmark, BarChart3, ArrowDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MacroLayer {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  questions: string[];
  signals: { label: string; impact: string }[];
  combinations: string[];
}

const layers: MacroLayer[] = [
  {
    id: 'pib',
    title: 'PIB',
    subtitle: 'Ritmo da Economia',
    icon: Activity,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/10',
    borderColor: 'border-border',
    questions: [
      'A economia está acelerando ou freando?',
      'O crescimento vem de consumo/investimento ou gasto estatal?',
    ],
    signals: [
      { label: 'PIB acelerado', impact: 'Favorece ações, small caps, cíclicos' },
      { label: 'PIB desacelerado', impact: 'Favorece defensivos, dólar, renda fixa' },
      { label: 'PIB vs Expectativa', impact: 'Surpresa > número absoluto' },
    ],
    combinations: [
      'PIB forte + Inflação controlada = Goldilocks (cenário ideal)',
      'PIB forte + Inflação alta = Juros sobem depois',
      'PIB fraco + Inflação baixa = Espaço para estímulos',
      'PIB fraco + Inflação alta = Estagflação (pior cenário)',
    ],
  },
  {
    id: 'inflacao',
    title: 'INFLAÇÃO',
    subtitle: 'Temperatura dos Preços',
    icon: Thermometer,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/10',
    borderColor: 'border-border',
    questions: [
      'O crescimento está gerando pressão nos preços?',
      'A inflação é de demanda, custos ou inercial?',
    ],
    signals: [
      { label: 'Inflação caindo', impact: 'Bolsa, small caps, growth stocks' },
      { label: 'Inflação subindo', impact: 'Dólar, renda fixa, defensivos' },
      { label: 'Inflação persistente', impact: 'Juros altos, mercado lateral' },
    ],
    combinations: [
      'Cheia vs Núcleo: BC olha núcleo (exclui alimentos e energia)',
      'Difusão alta (muitos itens subindo) = perigosa',
      'Inflação EUA manda → Juros amplifica → Dólar transmite → Mundo obedece',
      'Serviços refletem salários = inflação estrutural',
    ],
  },
  {
    id: 'juros',
    title: 'JUROS',
    subtitle: 'Decisão do Poder',
    icon: Landmark,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/10',
    borderColor: 'border-border',
    questions: [
      'O Banco Central precisa intervir?',
      'Qual a direção e expectativa dos juros?',
    ],
    signals: [
      { label: 'Juros subindo', impact: 'Crédito caro, ações sofrem, dólar sobe' },
      { label: 'Juros no topo', impact: 'Mercado antecipa queda, bolsa vira' },
      { label: 'Juros caindo', impact: 'Liquidez aumenta, risco respira' },
    ],
    combinations: [
      'PIB forte + Inflação alta → Juros sobem',
      'PIB fraco + Inflação baixa → Juros caem',
      'O topo dos juros é mais importante que o corte',
      'Curva invertida (curto > longo) = recessão à frente',
    ],
  },
  {
    id: 'grafico',
    title: 'GRÁFICO',
    subtitle: 'Onde o Dinheiro Vai',
    icon: BarChart3,
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30',
    questions: [
      'O fluxo confirma a tese macro?',
      'A amplitude do mercado é saudável?',
    ],
    signals: [
      { label: 'Juros sobem', impact: 'Ações sofrem, dólar fortalece' },
      { label: 'Juros caem', impact: 'Ações respiram, risco volta' },
      { label: 'Índice sobe com poucos líderes', impact: 'Fragilidade oculta' },
    ],
    combinations: [
      'Preço é consequência, não causa',
      'Índice rompe antes das ações individuais',
      'Fundos passivos + ETFs = índice virou ator, não observador',
      'Nunca faça swing comprado com índice em tendência de baixa',
    ],
  },
];

export function MacroLayersMap() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border border-border/50 bg-background">
        <div className="py-2 px-3 border-b border-border bg-muted/20">
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-muted-foreground">
            📐 MAPA DAS 4 CAMADAS MACRO
          </h3>
        </div>
        <div className="p-3">
          <p className="text-xs font-mono text-muted-foreground">
            PIB mostra o ritmo → Inflação mostra o calor → Juros decidem o freio → Gráfico confirma o fluxo
          </p>
        </div>
      </div>

      {/* Layers */}
      <div className="space-y-3">
        {layers.map((layer, index) => {
          const Icon = layer.icon;
          return (
            <motion.div
              key={layer.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={cn('border bg-background', layer.borderColor)}>
                {/* Layer Header */}
                <div className={cn('py-2 px-3 border-b flex items-center justify-between', layer.bgColor, layer.borderColor)}>
                  <div className="flex items-center gap-2">
                    <div className={cn('p-1 border', layer.borderColor, layer.bgColor)}>
                      <Icon className={cn('h-4 w-4', layer.color)} />
                    </div>
                    <div>
                      <span className={cn('text-sm font-mono font-bold uppercase tracking-wider', layer.color)}>
                        CAMADA {index + 1} — {layer.title}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground ml-2">
                        {layer.subtitle}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 space-y-3">
                  {/* Questions */}
                  <div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                      PERGUNTAS-CHAVE
                    </div>
                    {layer.questions.map((q, i) => (
                      <div key={i} className="flex items-start gap-2 mb-1">
                        <span className={cn('text-xs mt-0.5', layer.color)}>?</span>
                        <span className="text-xs font-mono text-foreground/80">{q}</span>
                      </div>
                    ))}
                  </div>

                  {/* Signals Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {layer.signals.map((signal, i) => (
                      <div key={i} className={cn('p-2 border', layer.borderColor, 'bg-card/30')}>
                        <div className={cn('text-[10px] font-mono font-bold mb-0.5', layer.color)}>
                          {signal.label}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground">
                          {signal.impact}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Combinations */}
                  <div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                      REGRAS OPERACIONAIS
                    </div>
                    <div className="space-y-1">
                      {layer.combinations.map((combo, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <ChevronRight className={cn('h-3 w-3 mt-0.5 shrink-0', layer.color)} />
                          <span className="text-[11px] font-mono text-foreground/70">{combo}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow connector */}
              {index < layers.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown className="h-4 w-4 text-muted-foreground/50" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

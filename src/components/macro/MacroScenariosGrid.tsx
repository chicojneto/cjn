import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Sun, Snowflake, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MacroScenario {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  condition: string;
  color: string;
  bgColor: string;
  borderColor: string;
  pib: string;
  inflacao: string;
  juros: string;
  favors: string[];
  avoids: string[];
  dayTrade: string;
  swingTrade: string;
}

const scenarios: MacroScenario[] = [
  {
    id: 'goldilocks',
    name: 'GOLDILOCKS',
    icon: Sun,
    condition: 'PIB sobe + Inflação controlada',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    pib: 'Acelerado',
    inflacao: 'Controlada / Caindo',
    juros: 'Estáveis ou caindo',
    favors: ['Ações', 'Small caps', 'Setores cíclicos', 'Emergentes', 'Carry trade'],
    avoids: ['Dólar', 'Renda fixa longa', 'Ouro (parcial)'],
    dayTrade: 'Compras em índices, opere continuação de tendência. Risco menor.',
    swingTrade: 'LONG bolsa, small caps, cíclicos. Tendência forte a favor.',
  },
  {
    id: 'overheating',
    name: 'SUPERAQUECIMENTO',
    icon: Flame,
    condition: 'PIB sobe + Inflação sobe',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    pib: 'Acelerado',
    inflacao: 'Subindo',
    juros: 'Subindo (BC intervém)',
    favors: ['Commodities', 'Bancos', 'Energia', 'Dólar'],
    avoids: ['Tech/Growth', 'Small caps', 'Bonds longos'],
    dayTrade: 'Atenção em dias de CPI/IPCA. Espere o impulso, opere correção.',
    swingTrade: 'Rotação para value, commodities, bancos. Evite growth.',
  },
  {
    id: 'slowdown',
    name: 'DESACELERAÇÃO',
    icon: Snowflake,
    condition: 'PIB cai + Inflação cai',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    pib: 'Desacelerado',
    inflacao: 'Caindo',
    juros: 'Espaço para cortes',
    favors: ['Bonds', 'Utilities', 'Saúde', 'Renda fixa'],
    avoids: ['Cíclicos', 'Commodities', 'Small caps'],
    dayTrade: 'Cautela. Índices podem cair mas juros futuros criam oportunidades.',
    swingTrade: 'Defensivos, bonds. Antecipar virada quando BC sinalizar corte.',
  },
  {
    id: 'stagflation',
    name: 'ESTAGFLAÇÃO',
    icon: AlertTriangle,
    condition: 'PIB cai + Inflação sobe',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    pib: 'Fraco / Negativo',
    inflacao: 'Alta / Persistente',
    juros: 'Altos por mais tempo',
    favors: ['Ouro', 'Dólar', 'Commodities duras', 'Cash'],
    avoids: ['Ações em geral', 'Bonds longos', 'Emergentes', 'Small caps'],
    dayTrade: 'Volatilidade extrema. VIX alto = sizing x0.5. Só opere com convicção.',
    swingTrade: 'Modo defensivo TOTAL. Ouro + Dólar. Seletividade máxima.',
  },
];

export function MacroScenariosGrid() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border border-border/50 bg-background">
        <div className="py-2 px-3 border-b border-purple-500/50 bg-purple-500/20">
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-purple-400">
            🎯 CENÁRIOS COMBINADOS
          </h3>
        </div>
        <div className="p-3">
          <p className="text-xs font-mono text-muted-foreground">
            Identifique qual cenário estamos e alinhe suas operações. "Esse PIB muda a trajetória da inflação e dos juros?"
          </p>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {scenarios.map((scenario, index) => {
          const Icon = scenario.icon;
          return (
            <motion.div
              key={scenario.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={cn('border bg-background', scenario.borderColor)}
            >
              {/* Scenario Header */}
              <div className={cn('py-2 px-3 border-b flex items-center gap-2', scenario.bgColor, scenario.borderColor)}>
                <Icon className={cn('h-4 w-4', scenario.color)} />
                <span className={cn('text-sm font-mono font-bold uppercase tracking-wider', scenario.color)}>
                  {scenario.name}
                </span>
              </div>

              <div className="p-3 space-y-3">
                {/* Condition */}
                <div className={cn('text-xs font-mono font-semibold p-2 border', scenario.bgColor, scenario.borderColor)}>
                  {scenario.condition}
                </div>

                {/* Macro Indicators */}
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="p-1.5 bg-card/30 border border-border/30">
                    <div className="text-[9px] font-mono text-muted-foreground uppercase">PIB</div>
                    <div className="text-[10px] font-mono font-bold text-foreground">{scenario.pib}</div>
                  </div>
                  <div className="p-1.5 bg-card/30 border border-border/30">
                    <div className="text-[9px] font-mono text-muted-foreground uppercase">Inflação</div>
                    <div className="text-[10px] font-mono font-bold text-foreground">{scenario.inflacao}</div>
                  </div>
                  <div className="p-1.5 bg-card/30 border border-border/30">
                    <div className="text-[9px] font-mono text-muted-foreground uppercase">Juros</div>
                    <div className="text-[10px] font-mono font-bold text-foreground">{scenario.juros}</div>
                  </div>
                </div>

                {/* Favors / Avoids */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[9px] font-mono font-bold text-emerald-400 uppercase mb-1">✓ FAVORECE</div>
                    {scenario.favors.map((f, i) => (
                      <div key={i} className="text-[10px] font-mono text-foreground/70">• {f}</div>
                    ))}
                  </div>
                  <div>
                    <div className="text-[9px] font-mono font-bold text-red-400 uppercase mb-1">✕ EVITAR</div>
                    {scenario.avoids.map((a, i) => (
                      <div key={i} className="text-[10px] font-mono text-foreground/70">• {a}</div>
                    ))}
                  </div>
                </div>

                {/* Trade Rules */}
                <div className="space-y-1.5">
                  <div className={cn('p-2 border', scenario.borderColor, 'bg-card/20')}>
                    <div className="text-[9px] font-mono font-bold text-amber-400 uppercase">DAY TRADE</div>
                    <div className="text-[10px] font-mono text-foreground/70">{scenario.dayTrade}</div>
                  </div>
                  <div className={cn('p-2 border', scenario.borderColor, 'bg-card/20')}>
                    <div className="text-[9px] font-mono font-bold text-cyan-400 uppercase">SWING TRADE</div>
                    <div className="text-[10px] font-mono text-foreground/70">{scenario.swingTrade}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

import { motion } from 'framer-motion';
import { AlertTriangle, Clock, TrendingUp, Repeat, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TradeRule {
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  rules: string[];
}

const dayTradeRules: TradeRule[] = [
  {
    category: 'REGRA DE OURO',
    icon: Shield,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
    rules: [
      'PIB, Inflação e Juros NÃO são indicadores técnicos',
      'Eles criam o PANO DE FUNDO do movimento',
      'Não tente prever - quem prevê, vira liquidez',
    ],
  },
  {
    category: 'EM DIA DE DADO (CPI, PIB, IPCA, NFP)',
    icon: Clock,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/10',
    borderColor: 'border-border',
    rules: [
      'NÃO antecipe o dado',
      'Espere o primeiro impulso (1-3 min)',
      'Opere CONTINUAÇÃO ou CORREÇÃO',
      'Foque em: Índice, Dólar, Juros Futuros',
      'Notícia gera volatilidade. Gráfico dá entrada.',
    ],
  },
  {
    category: 'ÍNDICE DEFINE A MARÉ',
    icon: TrendingUp,
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30',
    rules: [
      'Índice em alta → favorece compras, risco menor',
      'Índice em queda → prefira vendas, seletividade máxima',
      'Índice lateral → swing curto, paciência',
      'Ações seguem o índice - não brigue contra o fluxo',
    ],
  },
];

const swingTradeRules: TradeRule[] = [
  {
    category: 'CHECKLIST PRÉ-ENTRADA',
    icon: Shield,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/10',
    borderColor: 'border-border',
    rules: [
      '✓ PIB em aceleração ou estabilização?',
      '✓ Inflação caindo ou controlada?',
      '✓ Juros no topo ou iniciando queda?',
      '✓ Gráfico confirma rompimento ou suporte?',
      'Swing é alinhar-se ao ciclo, não prever.',
    ],
  },
  {
    category: 'ROTAÇÃO SETORIAL',
    icon: Repeat,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/10',
    borderColor: 'border-border',
    rules: [
      'PIB acelerando → Ações, small caps, cíclicos',
      'PIB desacelerando → Defensivos, dólar, renda fixa',
      'Juros subindo → Bancos, seguradoras. Evite tech.',
      'Juros caindo → Bolsa, small caps, ativos de risco',
      'PIB melhora + gráfico rompe resistência = vento a favor',
    ],
  },
  {
    category: 'ERROS FATAIS',
    icon: AlertTriangle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
    rules: [
      '✕ Operar o número em vez da expectativa',
      '✕ Ignorar inflação no contexto do PIB',
      '✕ Ignorar curva de juros',
      '✕ Usar dado macro como gatilho técnico',
      '✕ Swing comprado com índice em tendência de baixa',
      '✕ Achar que PIB bom = hora de comprar',
    ],
  },
];

export function MacroTradeRules() {
  return (
    <div className="space-y-4">
      {/* Day Trade Rules */}
      <div className="border border-border/50 bg-background">
        <div className="py-2 px-3 border-b border-warning/50 bg-warning/20">
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-warning">
            ⚡ REGRAS DAY TRADE — MACRO
          </h3>
        </div>
        <div className="p-3 space-y-3">
          {dayTradeRules.map((rule, index) => {
            const Icon = rule.icon;
            return (
              <motion.div
                key={rule.category}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn('p-2.5 border', rule.borderColor, rule.bgColor)}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className={cn('h-3.5 w-3.5', rule.color)} />
                  <span className={cn('text-[10px] font-mono font-bold uppercase tracking-wider', rule.color)}>
                    {rule.category}
                  </span>
                </div>
                <div className="space-y-1">
                  {rule.rules.map((r, i) => (
                    <div key={i} className="text-[11px] font-mono text-foreground/70">
                      {r}
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Swing Trade Rules */}
      <div className="border border-border/50 bg-background">
        <div className="py-2 px-3 border-b border-border bg-muted/20">
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-muted-foreground">
            📈 REGRAS SWING TRADE — MACRO
          </h3>
        </div>
        <div className="p-3 space-y-3">
          {swingTradeRules.map((rule, index) => {
            const Icon = rule.icon;
            return (
              <motion.div
                key={rule.category}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn('p-2.5 border', rule.borderColor, rule.bgColor)}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className={cn('h-3.5 w-3.5', rule.color)} />
                  <span className={cn('text-[10px] font-mono font-bold uppercase tracking-wider', rule.color)}>
                    {rule.category}
                  </span>
                </div>
                <div className="space-y-1">
                  {rule.rules.map((r, i) => (
                    <div key={i} className="text-[11px] font-mono text-foreground/70">
                      {r}
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

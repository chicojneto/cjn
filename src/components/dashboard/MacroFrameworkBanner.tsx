import { motion } from 'framer-motion';
import { Activity, Thermometer, Landmark, BarChart3, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavLink } from 'react-router-dom';

const layers = [
  {
    icon: Activity,
    label: 'PIB',
    sublabel: 'Ritmo',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/10',
    borderColor: 'border-border',
  },
  {
    icon: Thermometer,
    label: 'Inflação',
    sublabel: 'Temperatura',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/10',
    borderColor: 'border-border',
  },
  {
    icon: Landmark,
    label: 'Juros',
    sublabel: 'Decisão',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/10',
    borderColor: 'border-border',
  },
  {
    icon: BarChart3,
    label: 'Gráfico',
    sublabel: 'Fluxo',
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30',
  },
];

const scenarios = [
  { name: 'Goldilocks', condition: 'PIB↑ Inflação↓', color: 'text-success', bg: 'bg-success/10', border: 'border-success/30' },
  { name: 'Superaquecimento', condition: 'PIB↑ Inflação↑', color: 'text-muted-foreground', bg: 'bg-muted/10', border: 'border-border' },
  { name: 'Desaceleração', condition: 'PIB↓ Inflação↓', color: 'text-muted-foreground', bg: 'bg-muted/10', border: 'border-border' },
  { name: 'Estagflação', condition: 'PIB↓ Inflação↑', color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
];

export function MacroFrameworkBanner() {
  return (
    <div className="border border-border/50 bg-background">
      <div className="py-2 px-3 border-b border-border bg-muted/20">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-muted-foreground">
            📐 FRAMEWORK MACRO — 4 CAMADAS
          </h3>
          <NavLink to="/mapa-macro" className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors">
            Ver completo <ArrowRight className="h-3 w-3" />
          </NavLink>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* 4 Layers mini */}
        <div className="grid grid-cols-4 gap-2">
          {layers.map((layer, index) => {
            const Icon = layer.icon;
            return (
              <div key={layer.label} className={cn('p-2 border text-center', layer.borderColor, layer.bgColor)}>
                <Icon className={cn('h-4 w-4 mx-auto mb-1', layer.color)} />
                <div className={cn('text-[10px] font-mono font-bold', layer.color)}>{layer.label}</div>
                <div className="text-[9px] font-mono text-muted-foreground">{layer.sublabel}</div>
              </div>
            );
          })}
        </div>

        {/* Scenarios row */}
        <div>
          <div className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
            CENÁRIOS POSSÍVEIS
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
            {scenarios.map((s) => (
              <div key={s.name} className={cn('p-1.5 border', s.border, s.bg)}>
                <div className={cn('text-[10px] font-mono font-bold', s.color)}>{s.name}</div>
                <div className="text-[9px] font-mono text-muted-foreground">{s.condition}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Key rule */}
        <div className="p-2 border border-warning/30 bg-warning/10">
          <div className="text-[10px] font-mono text-warning">
            💡 "Esse PIB muda a trajetória da inflação e dos juros?" — Se não, o mercado ignora.
          </div>
        </div>
      </div>
    </div>
  );
}

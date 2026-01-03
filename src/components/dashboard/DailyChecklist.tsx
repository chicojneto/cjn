import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardCheck } from 'lucide-react';

interface ChecklistItem {
  text: string;
  color?: 'default' | 'green' | 'red' | 'yellow' | 'orange';
}

interface ChecklistSection {
  title?: string;
  items: ChecklistItem[];
}

const checklistData: ChecklistSection[] = [
  {
    items: [
      { text: 'New York: Futuros Americanos: S&P 500 (ES), Nasdaq (NQ), Dow Jones (YM).', color: 'default' },
      { text: 'ASIA: Nikkei, Hang Seng, Shanghai Composite. Relevante para commodites', color: 'default' },
      { text: 'Europa: DAX, FTSE Euro Stoxx 50 (indica humor global antes de NY abrir)', color: 'default' },
    ]
  },
  {
    items: [
      { text: 'DXY subindo → pressão de alta no dólar/real (WDO para cima e WIN baixo)', color: 'green' },
      { text: 'DXY caindo → alívio no câmbio, WDO tende a cair e WIN subir', color: 'green' },
      { text: 'EUR/USD e USD/JPY: Termômetros do apetite a risco global', color: 'yellow' },
    ]
  },
  {
    items: [
      { text: 'Minério de Ferro (Dalian/Singapura): Subindo forte → WIN tende a abrir positivo', color: 'orange' },
      { text: 'Brent e WTI: Petrobras pesa muito no índice. Olhe: o crack spread e estoques da API/EIA', color: 'orange' },
      { text: 'Cobre: Indicador de atividade industrial global. Antecipa movimentos de risk-on/risk-off', color: 'orange' },
      { text: 'Ouro disparando = medo no mercado = emergentes sofrem', color: 'orange' },
    ]
  },
  {
    items: [
      { text: 'DI Futuro (B3): DI1F mais curto (3-6 meses) para expectativa de Selic. Curva abrindo (juros subindo) = pressão no Ibovespa', color: 'yellow' },
      { text: 'Treasuries (EUA): Yield 10 anos (US10Y) acima de 4.5% = estresse. Yield caindo = apetite por risco, bom para emergentes', color: 'yellow' },
    ]
  },
  {
    items: [
      { text: 'CDS Brasil 5 anos: Risco país subindo = fuga de capital = dólar sobe, bolsa cai', color: 'red' },
    ]
  },
  {
    items: [
      { text: 'Futuros EUA: Define o humor de abertura', color: 'default' },
      { text: 'DXY: Direção do dólar global', color: 'default' },
      { text: 'Minério + Petróleo: Peso das blue chips', color: 'default' },
      { text: 'DI e Treasuries: Custo de capital', color: 'default' },
      { text: 'Agenda: Eventos movem mercado', color: 'default' },
      { text: 'Fluxo gringo: Quem está comprando/vendendo', color: 'default' },
    ]
  },
  {
    title: 'CORRELAÇÕES PRÁTICAS',
    items: []
  },
  {
    title: 'PARA WIN',
    items: [
      { text: 'Minério sobe + Petróleo sobe + Futuros EUA positivos = viés comprador', color: 'green' },
      { text: 'DI abrindo + CDS subindo + Gringo vendendo = viés vendedor', color: 'red' },
    ]
  },
  {
    title: 'PARA WDO',
    items: [
      { text: 'DXY forte + Treasuries subindo + CDS aumentando = dólar para cima', color: 'green' },
      { text: 'DXY fraco + Commodities fortes + Fluxo entrando = dólar para baixo', color: 'red' },
    ]
  },
  {
    title: 'PARA XAU/USD',
    items: [
      { text: 'DXY caindo + VIX subindo + Yields caindo + Inflação Forte = LONG', color: 'green' },
      { text: 'DXY subindo + VIX baixo + Yields subindo = Short', color: 'red' },
    ]
  },
];

const colorClasses: Record<string, string> = {
  default: 'text-foreground',
  green: 'text-emerald-500',
  red: 'text-red-500',
  yellow: 'text-yellow-500',
  orange: 'text-orange-500',
};

export function DailyChecklist() {
  return (
    <Card className="border-border/30 bg-card/50">
      <CardHeader className="py-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" />
          Check List Diário
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-3">
          {checklistData.map((section, sectionIdx) => (
            <div key={sectionIdx}>
              {section.title && (
                <h3 className={`font-bold text-sm mb-1 ${
                  section.title === 'CORRELAÇÕES PRÁTICAS' 
                    ? 'text-yellow-500 mt-4' 
                    : section.title.startsWith('PARA') 
                      ? 'text-red-500 mt-2' 
                      : 'text-foreground'
                }`}>
                  {section.title}
                </h3>
              )}
              {section.items.length > 0 && (
                <div className="space-y-0.5">
                  {section.items.map((item, itemIdx) => (
                    <p 
                      key={itemIdx} 
                      className={`text-xs leading-relaxed ${colorClasses[item.color || 'default']}`}
                    >
                      {item.text}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { NotebookPen, RotateCcw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  protocoloMatinal,
  hierarquiaSinais,
  camadaGex,
  configuracaoPorAtivo,
  type PlaybookBlock,
} from '@/lib/playbookContent';

const STORAGE_KEY = 'playbook-protocolo-matinal';

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function loadChecks(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { date: string; checks: Record<string, boolean> };
    if (parsed.date !== todayKey()) return {};
    return parsed.checks ?? {};
  } catch {
    return {};
  }
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border/60 p-6 text-center">
      <p className="text-sm text-muted-foreground">
        Conteúdo de <span className="text-foreground font-medium">{label}</span> ainda não preenchido. Cole o texto e eu monto os cards.
      </p>
    </div>
  );
}

function BlockCards({ blocks, label }: { blocks: PlaybookBlock[]; label: string }) {
  if (blocks.length === 0) return <EmptyState label={label} />;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {blocks.map((block) => (
        <Card key={block.title} className="bg-card/60 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">{block.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {block.items.map((line, i) => (
              <div key={i} className="flex gap-2 text-sm text-muted-foreground">
                <span className="text-primary/60 font-mono text-xs mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                <span className="leading-relaxed">{line}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ProtocoloMatinal() {
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setChecks(loadChecks());
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as { date: string };
          if (parsed.date !== todayKey()) setChecks({});
        } catch {
          /* ignore */
        }
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const persist = (next: Record<string, boolean>) => {
    setChecks(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayKey(), checks: next }));
  };

  if (protocoloMatinal.length === 0) return <EmptyState label="Protocolo Matinal" />;

  const done = protocoloMatinal.filter((s) => checks[s.id]).length;
  const pct = Math.round((done / protocoloMatinal.length) * 100);

  return (
    <Card className="bg-card/60 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide">Protocolo Matinal</CardTitle>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-muted-foreground">
              {done}/{protocoloMatinal.length} · {pct}%
            </span>
            <Button variant="ghost" size="sm" onClick={() => persist({})} className="h-7 px-2 text-xs">
              <RotateCcw className="h-3 w-3 mr-1" /> Limpar
            </Button>
          </div>
        </div>
        <Progress value={pct} className="h-1 mt-2" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/40">
          <div className="grid grid-cols-[3rem_5.5rem_1fr] gap-3 px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>OK</span>
            <span>Horário</span>
            <span>Ação</span>
          </div>
          {protocoloMatinal.map((step) => (
            <label
              key={step.id}
              className={cn(
                'grid grid-cols-[3rem_5.5rem_1fr] gap-3 px-4 py-3 items-start cursor-pointer transition-colors hover:bg-muted/30',
                checks[step.id] && 'bg-success/5'
              )}
            >
              <Checkbox
                checked={!!checks[step.id]}
                onCheckedChange={(v) => persist({ ...checks, [step.id]: !!v })}
              />
              <span className="font-mono text-xs text-muted-foreground pt-0.5">{step.horario}</span>
              <span className="text-sm">
                <span className={cn(checks[step.id] && 'line-through text-muted-foreground')}>{step.acao}</span>
                {step.detalhe && (
                  <span className="block text-xs text-muted-foreground mt-0.5">{step.detalhe}</span>
                )}
              </span>
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Playbook() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <NotebookPen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Playbook</h1>
          <p className="text-sm text-muted-foreground">Rotina operacional, hierarquia de sinais e configurações</p>
        </div>
      </div>

      <Tabs defaultValue="protocolo" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="protocolo">Protocolo Matinal</TabsTrigger>
          <TabsTrigger value="hierarquia">Hierarquia de Sinais</TabsTrigger>
          <TabsTrigger value="gex">Camada GEX</TabsTrigger>
          <TabsTrigger value="ativos">Configuração por ativo</TabsTrigger>
        </TabsList>

        <TabsContent value="protocolo">
          <ProtocoloMatinal />
        </TabsContent>
        <TabsContent value="hierarquia">
          <BlockCards blocks={hierarquiaSinais} label="Hierarquia de Sinais" />
        </TabsContent>
        <TabsContent value="gex">
          <BlockCards blocks={camadaGex} label="Camada GEX" />
        </TabsContent>
        <TabsContent value="ativos">
          <BlockCards blocks={configuracaoPorAtivo} label="Configuração por ativo" />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

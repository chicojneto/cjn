import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { NEWS_ASSETS, type NewsAsset, type Noticia, useNoticias } from '@/hooks/useNoticias';

const TZ = 'America/Sao_Paulo';

function updatedAgo(iso?: string) {
  if (!iso) return 'aguardando atualização';
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return 'atualizado agora';
  if (minutes < 60) return `atualizado há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `atualizado há ${hours}h`;
}

function timeLabel(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(date);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(now);
  const yesterdayDate = new Date(now.getTime() - 86400000);
  const yesterday = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(yesterdayDate);
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
  if (day === today) return time;
  if (day === yesterday) return `ontem ${time}`;
  return `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: TZ }).replace('.', '')} ${time}`;
}

function NewsCard({ item }: { item: Noticia }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
        <span>{item.fonte}</span>
        <span aria-hidden="true">·</span>
        <time className="font-mono" dateTime={item.publicado_em}>{timeLabel(item.publicado_em)}</time>
        {item.relevancia === 3 && (
          <span className="ml-auto rounded-md border border-warning/30 bg-warning/10 px-2 py-0.5 text-warning">Alta relevância</span>
        )}
        {item.relevancia === 2 && (
          <span className="ml-auto rounded-md bg-muted px-2 py-0.5 text-muted-foreground">Relevante</span>
        )}
      </div>

      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-start gap-2 text-[17px] font-medium leading-snug text-foreground hover:underline"
      >
        <span>{item.titulo_pt}</span>
        <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
      </a>
      <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{item.resumo}</p>

      {item.ativos.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {item.ativos.map((asset) => (
            <span key={asset} className="rounded-md border border-border bg-secondary/50 px-2 py-1 font-mono text-[11px] text-foreground">
              {asset}
            </span>
          ))}
        </div>
      )}

      <p className="mt-4 border-t border-border pt-3 text-[12px] text-muted-foreground">
        Fonte: {item.fonte} — leia a matéria completa no site original
      </p>
    </Card>
  );
}

export default function Noticias() {
  const [asset, setAsset] = useState<NewsAsset>('ALL');
  const [onlyRelevant, setOnlyRelevant] = useState(true);
  const [limit, setLimit] = useState(30);
  const { data, isLoading, isError, isFetching, refetch } = useNoticias(asset, onlyRelevant, limit);

  useEffect(() => setLimit(30), [asset, onlyRelevant]);
  const newest = data?.items[0]?.publicado_em;
  const updateText = useMemo(() => updatedAgo(newest), [newest, isFetching]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-2xl font-medium text-foreground">Notícias</h1>
        <span className="font-mono text-[12px] text-muted-foreground">{updateText}</span>
      </header>

      <div className="space-y-3 border-y border-border py-4">
        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
          {NEWS_ASSETS.map((filter) => (
            <Button
              key={filter.value}
              type="button"
              size="sm"
              variant={asset === filter.value ? 'default' : 'outline'}
              className="shrink-0 rounded-full"
              onClick={() => setAsset(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
        <label className="flex w-fit cursor-pointer items-center gap-2 text-[13px] text-foreground">
          <Switch checked={onlyRelevant} onCheckedChange={setOnlyRelevant} aria-label="Mostrar só notícias relevantes" />
          Só relevantes
        </label>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-48 rounded-[14px]" />)}</div>
      ) : isError ? (
        <div className="flex min-h-48 flex-col items-center justify-center gap-3 border-y border-border text-center">
          <p className="text-sm text-muted-foreground">Não foi possível carregar as notícias.</p>
          <Button variant="outline" onClick={() => refetch()}><RefreshCw /> Tentar novamente</Button>
        </div>
      ) : data?.items.length ? (
        <>
          <div className="grid grid-cols-1 gap-3">
            {data.items.map((item) => <NewsCard key={item.id} item={item} />)}
          </div>
          {data.hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={() => setLimit((value) => value + 30)} disabled={isFetching}>
                {isFetching ? 'Carregando…' : 'Carregar mais'}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="flex min-h-48 items-center justify-center border-y border-border text-center text-sm text-muted-foreground">
          Nenhuma notícia relevante nas últimas horas.
        </div>
      )}
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart3, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MarketTable } from '@/components/dashboard/MarketTable';
import { supabase } from '@/integrations/supabase/client';

const PANEL_ORDER = [
  'Pré Abertura B3',
  'Índices Acionários - B3',
  'Commodities',
  'Cesta DXY',
  'Índices Americanos',
  'Outros Ativos',
  'Índices Europeus',
  'Ações',
  'Emergentes',
  'Índices Asiáticos',
  'ADR',
];

interface PanelsResponse {
  panels: Record<string, any[]>;
}

async function fetchPanels(): Promise<Record<string, any[]>> {
  const { data, error } = await supabase.functions.invoke<PanelsResponse>('fetch-markets-panels');
  if (error) {
    console.warn('fetch-markets-panels error:', error.message);
    return {};
  }
  return data?.panels || {};
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function Mercados() {
  const { data: panels, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['markets-panels'],
    queryFn: fetchPanels,
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: false,
    throwOnError: false,
    refetchOnWindowFocus: false,
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Mercados</h1>
            <p className="text-sm text-muted-foreground">
              Cotações globais por categoria
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-8 gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          <span className="text-xs">Atualizar</span>
        </Button>
      </motion.div>

      {/* Panels grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-8 w-full" />
              {Array.from({ length: 6 }).map((_, j) => (
                <Skeleton key={j} className="h-9 w-full" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          variants={item}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-min"
        >
          {PANEL_ORDER.map((title) => {
            const quotes = panels?.[title] || [];
            if (!quotes.length) return null;
            const featured = title === 'Pré Abertura B3';
            return (
              <div
                key={title}
                className={featured ? 'md:col-span-2 lg:col-span-3 xl:col-span-3' : ''}
              >
                <MarketTable
                  title={title}
                  quotes={quotes}
                  compact={!featured}
                  columns={featured ? 2 : 1}
                  showTime={false}
                />
              </div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}

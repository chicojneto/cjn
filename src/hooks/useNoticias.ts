import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const NEWS_ASSETS = [
  { value: 'ALL', label: 'Todos' },
  { value: 'NASDAQ', label: 'Nasdaq' },
  { value: 'SP500', label: 'S&P 500' },
  { value: 'DOW', label: 'Dow' },
  { value: 'XAUUSD', label: 'Ouro' },
  { value: 'EURUSD', label: 'EUR/USD' },
  { value: 'USDJPY', label: 'USD/JPY' },
  { value: 'MACRO', label: 'Macro' },
] as const;

export type NewsAsset = typeof NEWS_ASSETS[number]['value'];
export type Noticia = {
  id: string;
  fonte: string;
  titulo_original: string;
  titulo_pt: string;
  resumo: string;
  ativos: string[];
  relevancia: number;
  url: string;
  publicado_em: string;
  criado_em: string;
};

export function useNoticias(asset: NewsAsset, onlyRelevant: boolean, limit: number) {
  return useQuery({
    queryKey: ['noticias', asset, onlyRelevant, limit],
    queryFn: async () => {
      let query = supabase
        .from('noticias')
        .select('*')
        .order('publicado_em', { ascending: false })
        .limit(limit + 1);
      if (asset !== 'ALL') query = query.contains('ativos', [asset]);
      if (onlyRelevant) query = query.gte('relevancia', 2);
      const { data, error } = await query;
      if (error) throw error;
      return {
        items: (data ?? []).slice(0, limit) as Noticia[],
        hasMore: (data?.length ?? 0) > limit,
      };
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000,
    throwOnError: false,
  });
}

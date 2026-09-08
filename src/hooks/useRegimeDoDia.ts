import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMarketCorrelations } from '@/hooks/useMarketCorrelations';
import { calcularRegimeDoDia, type RegimeDoDia } from '@/lib/regimeDoDia';

/** Variação do DI Jan/29 (bps) entre as duas últimas atualizações manuais da curva. */
function useDiJan29ChangeBps() {
  return useQuery({
    queryKey: ['di-jan29-change'],
    queryFn: async (): Promise<number | null> => {
      const { data, error } = await supabase
        .from('di_curve_manual')
        .select('di_jan29, updated_at')
        .order('updated_at', { ascending: false })
        .limit(2);
      if (error || !data || data.length < 2) return null;
      const [latest, prev] = data as { di_jan29: number | null }[];
      if (typeof latest.di_jan29 !== 'number' || typeof prev.di_jan29 !== 'number') return null;
      return (latest.di_jan29 - prev.di_jan29) * 100;
    },
    staleTime: 60_000,
    retry: false,
    throwOnError: false,
  });
}

export function useRegimeDoDia(): { regime: RegimeDoDia; isLoading: boolean } {
  const { data, isLoading } = useMarketCorrelations();
  const { data: diJan29ChangeBps } = useDiJan29ChangeBps();

  return {
    regime: calcularRegimeDoDia(data, { diJan29ChangeBps: diJan29ChangeBps ?? null }),
    isLoading,
  };
}

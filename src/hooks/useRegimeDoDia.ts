import { useMarketCorrelations } from '@/hooks/useMarketCorrelations';
import { calcularRegimeDoDia, type RegimeDoDia } from '@/lib/regimeDoDia';

export function useRegimeDoDia(): { regime: RegimeDoDia; isLoading: boolean } {
  const { data, isLoading } = useMarketCorrelations();
  return { regime: calcularRegimeDoDia(data), isLoading };
}

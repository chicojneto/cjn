import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
  timestamp: string | null;
}

export interface BrazilRatesData {
  cdi: { value: number; date: string } | null;
  cdsBrazil: { value: number; change: number; changePercent: number } | null;
  diFutures: { contract: string; rate: number; change: number }[] | null;
}

export interface CorrelationAnalysis {
  dxy: MarketData | null;
  vix: MarketData | null;
  us10y: MarketData | null;
  us2y: MarketData | null;
  gold: MarketData | null;
  oil: MarketData | null;
  ironOre: MarketData | null;
  copper: MarketData | null;
  sp500Futures: MarketData | null;
  nasdaqFutures: MarketData | null;
  dowFutures: MarketData | null;
  eurUsd: MarketData | null;
  usdJpy: MarketData | null;
  usdBrl: MarketData | null;
  ibovFutures: MarketData | null;
  // Asian Markets
  nikkei: MarketData | null;
  hangSeng: MarketData | null;
  szseComp: MarketData | null;
  // European Markets
  dax: MarketData | null;
  ftse: MarketData | null;
  stoxx50: MarketData | null;
  brazilRates: BrazilRatesData;
  winBias: 'bullish' | 'bearish' | 'neutral';
  wdoBias: 'bullish' | 'bearish' | 'neutral';
  goldBias: 'bullish' | 'bearish' | 'neutral';
  winSignals: string[];
  wdoSignals: string[];
  goldSignals: string[];
}

interface CorrelationResponse {
  success: boolean;
  data: CorrelationAnalysis;
  rawData: Record<string, MarketData | null>;
  timestamp: string;
  error?: string;
}

export function useMarketCorrelations() {
  return useQuery({
    queryKey: ['market-correlations'],
    queryFn: async (): Promise<CorrelationAnalysis> => {
      const { data, error } = await supabase.functions.invoke<CorrelationResponse>('fetch-market-correlations');
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to fetch correlations');
      }
      
      return data.data;
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

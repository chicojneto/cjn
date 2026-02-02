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

export interface DIFutureContract {
  contract: string;
  label: string;
  category: 'short_term' | 'one_year' | 'macro';
  rate: number;
  change: number;
  description: string;
}

export interface CurveAnalysis {
  shortTermRate: number;
  oneYearRate: number;
  macroRate: number;
  spread: number;
  inclination: 'positive' | 'negative' | 'flat';
  signal: string;
}

export interface BrazilRatesData {
  cdi: { value: number; date: string } | null;
  cdsBrazil: { value: number; change: number; changePercent: number } | null;
  diFutures: DIFutureContract[] | null;
  curveAnalysis: CurveAnalysis | null;
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
    queryFn: async (): Promise<CorrelationAnalysis | null> => {
      const { data, error } = await supabase.functions.invoke<CorrelationResponse>('fetch-market-correlations');
      
      if (error) {
        console.warn('fetch-market-correlations error:', error.message);
        return null;
      }
      
      // Handle rate limiting gracefully
      if (data && !data.success && (data as any).error === 'Rate limit exceeded') {
        console.log('fetch-market-correlations rate limited, retry after:', (data as any).retry_after);
        return null;
      }
      
      if (!data?.success) {
        console.warn('fetch-market-correlations failed:', data?.error);
        return null;
      }
      
      return data.data;
    },
    refetchInterval: 15 * 60 * 1000, // 15 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on failure to avoid hammering rate-limited endpoint
  });
}

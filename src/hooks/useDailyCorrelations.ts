import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CorrelationEvent {
  title: string;
  impact: string;
  time: string;
  direction: 'positive' | 'negative' | 'neutral';
}

interface AssetCorrelation {
  asset: string;
  assetName: string;
  impact: 'bullish' | 'bearish' | 'neutral';
  strength: 'high' | 'medium' | 'low';
  ruleBasedReason: string;
  events: CorrelationEvent[];
}

interface AnalysisResult {
  date: string;
  summary: string;
  correlations: AssetCorrelation[];
  aiAnalysis?: string;
  eventsCount: number;
  highImpactCount: number;
}

interface AnalysisResponse {
  success: boolean;
  data: AnalysisResult;
  error?: string;
}

export function useDailyCorrelations() {
  return useQuery({
    queryKey: ['daily-correlations'],
    queryFn: async (): Promise<AnalysisResult | null> => {
      const { data, error } = await supabase.functions.invoke<AnalysisResponse>('analyze-daily-correlations');
      
      if (error) {
        console.warn('analyze-daily-correlations error:', error.message);
        return null;
      }
      
      // Handle rate limiting gracefully
      if (data && !data.success && (data as any).error === 'Rate limit exceeded') {
        console.log('analyze-daily-correlations rate limited, retry after:', (data as any).retry_after);
        return null;
      }
      
      if (!data?.success) {
        console.warn('analyze-daily-correlations failed:', data?.error);
        return null;
      }
      
      return data.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchInterval: 60 * 60 * 1000, // 1 hour
    retry: false, // Don't retry on failure to avoid hammering rate-limited endpoint
  });
}

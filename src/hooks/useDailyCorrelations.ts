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
    queryFn: async (): Promise<AnalysisResult> => {
      const { data, error } = await supabase.functions.invoke<AnalysisResponse>('analyze-daily-correlations');
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to fetch correlations analysis');
      }
      
      return data.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchInterval: 60 * 60 * 1000, // 1 hour
  });
}

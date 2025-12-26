import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Asset } from '@/types/database';

export function useAssets() {
  return useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('symbol');
      
      if (error) throw error;
      return data as Asset[];
    },
  });
}

export function useAssetCorrelations(assetId?: string) {
  return useQuery({
    queryKey: ['asset-correlations', assetId],
    queryFn: async () => {
      let query = supabase
        .from('asset_correlations')
        .select(`
          *,
          assets (*),
          indicators (*)
        `);
      
      if (assetId) {
        query = query.eq('asset_id', assetId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!assetId || assetId === undefined,
  });
}
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Asset } from '@/types/database';

// Custom order for assets display
const ASSET_ORDER = ['XAU/USD', 'WIN1!', 'WDO1!', 'USD/JPY', 'EUR/USD', 'GBP/USD', 'USD/CAD'];

export function useAssets() {
  return useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select('*');
      
      if (error) throw error;
      
      // Sort by custom order
      const sorted = (data as Asset[]).sort((a, b) => {
        const indexA = ASSET_ORDER.indexOf(a.symbol);
        const indexB = ASSET_ORDER.indexOf(b.symbol);
        // If not in order list, put at end
        const orderA = indexA === -1 ? 999 : indexA;
        const orderB = indexB === -1 ? 999 : indexB;
        return orderA - orderB;
      });
      
      return sorted;
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
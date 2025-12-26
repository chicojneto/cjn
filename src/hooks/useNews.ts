import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { News, NewsAsset } from '@/types/database';

export function useNews(limit = 20) {
  return useQuery({
    queryKey: ['news', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data as News[];
    },
  });
}

export function useNewsWithAssets(limit = 20) {
  return useQuery({
    queryKey: ['news-with-assets', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news')
        .select(`
          *,
          news_assets (
            *,
            assets (*)
          )
        `)
        .order('published_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data;
    },
  });
}
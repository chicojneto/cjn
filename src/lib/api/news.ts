import { supabase } from '@/integrations/supabase/client';

export const newsApi = {
  async fetchNews(): Promise<{ success: boolean; error?: string; inserted?: number }> {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-news');

      if (error) {
        // supabase client wraps non-2xx as FunctionsHttpError
        const message = error.message || '';
        if (message.includes('429') || message.toLowerCase().includes('rate limit')) {
          console.log('News fetch rate limited, will retry later');
          return { success: false, error: 'Rate limit exceeded' };
        }
        return { success: false, error: message };
      }

      // Handle rate limit returned in body with 200 status
      if (data?.error === 'Rate limit exceeded') {
        return { success: false, error: 'Rate limit exceeded' };
      }
      
      return data ?? { success: false, error: 'No data returned' };
    } catch (err: any) {
      console.warn('News fetch error caught:', err);
      return { success: false, error: err?.message || 'Unknown error' };
    }
  },
};

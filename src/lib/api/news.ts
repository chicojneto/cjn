import { supabase } from '@/integrations/supabase/client';

export const newsApi = {
  async fetchNews(): Promise<{ success: boolean; error?: string; inserted?: number }> {
    const { data, error } = await supabase.functions.invoke('fetch-news');

    if (error) {
      return { success: false, error: error.message };
    }
    
    return data;
  },
};

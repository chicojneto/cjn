import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { EconomicEvent } from '@/types/database';

export function useEconomicEvents(daysAhead = 7) {
  return useQuery({
    queryKey: ['economic-events', daysAhead],
    queryFn: async () => {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + daysAhead);
      
      const { data, error } = await supabase
        .from('economic_events')
        .select(`
          *,
          indicators (*)
        `)
        .gte('event_date', now.toISOString())
        .lte('event_date', futureDate.toISOString())
        .order('event_date', { ascending: true });
      
      if (error) throw error;
      return data as (EconomicEvent & { indicators: { name: string; category: string } | null })[];
    },
  });
}

export function useUpcomingEvents(limit = 5) {
  return useQuery({
    queryKey: ['upcoming-events', limit],
    queryFn: async () => {
      const now = new Date();
      
      const { data, error } = await supabase
        .from('economic_events')
        .select(`
          *,
          indicators (*)
        `)
        .gte('event_date', now.toISOString())
        .order('event_date', { ascending: true })
        .limit(limit);
      
      if (error) throw error;
      return data as (EconomicEvent & { indicators: { name: string; category: string } | null })[];
    },
  });
}
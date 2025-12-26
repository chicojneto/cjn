import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Alert } from '@/types/database';
import { useEffect } from 'react';

export function useAlerts(unreadOnly = false) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['alerts', unreadOnly],
    queryFn: async () => {
      let q = supabase
        .from('alerts')
        .select(`
          *,
          assets (*)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (unreadOnly) {
        q = q.eq('is_read', false);
      }
      
      const { data, error } = await q;
      if (error) throw error;
      return data as (Alert & { assets: { symbol: string; name: string } | null })[];
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('alerts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['alerts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useMarkAlertRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .eq('id', alertId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}
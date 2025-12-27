import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Alert } from '@/types/database';
import { useEffect, useState, useCallback } from 'react';

const READ_ALERTS_KEY = 'read_alerts';

function getReadAlerts(): Set<string> {
  try {
    const stored = localStorage.getItem(READ_ALERTS_KEY);
    return new Set(stored ? JSON.parse(stored) : []);
  } catch {
    return new Set();
  }
}

function saveReadAlerts(alerts: Set<string>) {
  localStorage.setItem(READ_ALERTS_KEY, JSON.stringify([...alerts]));
}

export function useAlerts(unreadOnly = false) {
  const queryClient = useQueryClient();
  const [readAlerts, setReadAlerts] = useState<Set<string>>(getReadAlerts);
  
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
      
      const { data, error } = await q;
      if (error) throw error;
      
      // Apply client-side read status
      const alertsWithReadStatus = (data || []).map(alert => ({
        ...alert,
        is_read: readAlerts.has(alert.id)
      }));
      
      if (unreadOnly) {
        return alertsWithReadStatus.filter(a => !a.is_read) as (Alert & { assets: { symbol: string; name: string } | null })[];
      }
      
      return alertsWithReadStatus as (Alert & { assets: { symbol: string; name: string } | null })[];
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

  const markAsRead = useCallback((alertId: string) => {
    const newReadAlerts = new Set(readAlerts);
    newReadAlerts.add(alertId);
    setReadAlerts(newReadAlerts);
    saveReadAlerts(newReadAlerts);
    queryClient.invalidateQueries({ queryKey: ['alerts'] });
  }, [readAlerts, queryClient]);

  return {
    ...query,
    markAsRead
  };
}

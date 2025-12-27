import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { newsApi } from '@/lib/api/news';

const FETCH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function useAutoFetchNews() {
  const queryClient = useQueryClient();
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    const fetchNews = async () => {
      console.log('Fetching news automatically...');
      const result = await newsApi.fetchNews();
      
      if (result.success) {
        console.log(`News fetched: ${result.inserted} inserted`);
        // Invalidate news queries to refetch data
        queryClient.invalidateQueries({ queryKey: ['news'] });
        queryClient.invalidateQueries({ queryKey: ['news-with-assets'] });
      } else {
        console.error('Failed to fetch news:', result.error);
      }
    };

    // Fetch immediately on mount (only once)
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchNews();
    }

    // Set up interval for periodic fetching
    const intervalId = setInterval(fetchNews, FETCH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [queryClient]);
}

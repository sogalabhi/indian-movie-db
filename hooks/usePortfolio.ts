'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Portfolio, MovieStock } from '@/lib/market/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface PortfolioWithStock extends Portfolio {
  movie_stocks: MovieStock | null;
}

export function usePortfolio(userId: string | null) {
  const [portfolio, setPortfolio] = useState<PortfolioWithStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('portfolios')
          .select(`
            *,
            movie_stocks (
              id,
              title,
              poster_path,
              current_price,
              price_change_24h,
              status
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        setPortfolio(data || []);
      } catch (err: any) {
        console.error('Error fetching portfolio:', err);
        setError(err.message || 'Failed to fetch portfolio');
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();

    // Subscribe to portfolio changes
    const channel: RealtimeChannel = supabase
      .channel(`portfolios:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portfolios',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Refetch on any change
          fetchPortfolio();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { portfolio, loading, error };
}


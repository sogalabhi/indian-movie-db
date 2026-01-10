'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useStockPrice(movieId: string) {
  const [price, setPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now()); // 🔑 Key for animation

  useEffect(() => {
    // Initial fetch
    const fetchPrice = async () => {
      const { data } = await supabase
        .from('movie_stocks')
        .select('current_price, price_change_24h, last_updated')
        .eq('id', movieId)
        .single();
      
      if (data) {
        setPrice(data.current_price);
        setPriceChange(data.price_change_24h);
        setLastUpdated(new Date(data.last_updated).getTime());
      }
    };

    fetchPrice();

    // Subscribe to changes
    const channel: RealtimeChannel = supabase
      .channel(`movie_stocks:${movieId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'movie_stocks',
          filter: `id=eq.${movieId}`,
        },
        (payload) => {
          const newData = payload.new as any;
          setPrice(newData.current_price);
          setPriceChange(newData.price_change_24h);
          // 🔑 CRITICAL: Update timestamp to force animation reset
          setLastUpdated(Date.now());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [movieId]);

  return { price, priceChange, lastUpdated };
}


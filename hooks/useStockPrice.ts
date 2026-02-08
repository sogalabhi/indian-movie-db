'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useStockPrice(movieId: string) {
  const [price, setPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  // Initialize with 0, will be set in useEffect to avoid impure function call during render
  const [lastUpdated, setLastUpdated] = useState<number>(0); // 🔑 Key for animation

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
    
    // Set initial timestamp after mount to avoid impure function call
    // Use setTimeout to avoid synchronous setState in effect
    const timeoutId = setTimeout(() => {
      setLastUpdated(Date.now());
    }, 0);

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
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [movieId]);

  return { price, priceChange, lastUpdated };
}


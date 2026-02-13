'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { MovieStock } from '@/lib/market/types';

export type SortOption = 'price_asc' | 'price_desc' | 'change_asc' | 'change_desc' | 'name_asc';
export type FilterStatus = 'ALL' | 'ACTIVE' | 'UPCOMING';

export function useMarketData() {
  const [stocks, setStocks] = useState<MovieStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('price_desc');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('movie_stocks')
          .select('*');

        // Apply status filter
        if (filterStatus !== 'ALL') {
          query = query.eq('status', filterStatus);
        }

        // Apply search filter
        if (searchQuery) {
          query = query.ilike('title', `%${searchQuery}%`);
        }

        // Apply sorting
        switch (sortBy) {
          case 'price_asc':
            query = query.order('current_price', { ascending: true });
            break;
          case 'price_desc':
            query = query.order('current_price', { ascending: false });
            break;
          case 'change_asc':
            query = query.order('price_change_24h', { ascending: true });
            break;
          case 'change_desc':
            query = query.order('price_change_24h', { ascending: false });
            break;
          case 'name_asc':
            query = query.order('title', { ascending: true });
            break;
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        setStocks(data || []);
      } catch (err: any) {
        console.error('Error fetching market data:', err);
        setError(err.message || 'Failed to fetch market data');
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();

    // Note: Real-time subscription removed to reduce Supabase quota usage
    // Market page now relies on ISR (Incremental Static Regeneration) for updates
    // Users will see fresh data on page load/refresh (60s revalidation)
  }, [searchQuery, sortBy, filterStatus]);

  return {
    stocks,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    filterStatus,
    setFilterStatus,
  };
}


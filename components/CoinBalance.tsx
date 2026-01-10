'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface CoinBalanceProps {
  className?: string;
  showIcon?: boolean;
  variant?: 'default' | 'compact';
}

export default function CoinBalance({ 
  className, 
  showIcon = true,
  variant = 'default'
}: CoinBalanceProps) {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setBalance(null);
      setLoading(false);
      return;
    }

    const fetchBalance = async () => {
      try {
        const { data, error } = await supabase
          .from('market_users')
          .select('coins')
          .eq('id', user.uid)
          .single();

        if (error) throw error;

        setBalance(data?.coins || 0);
      } catch (err) {
        console.error('Error fetching coin balance:', err);
        setBalance(0);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();

    // Subscribe to balance changes
    const channel: RealtimeChannel = supabase
      .channel(`market_users:${user.uid}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'market_users',
          filter: `id=eq.${user.uid}`,
        },
        (payload) => {
          const newData = payload.new as any;
          setBalance(newData.coins);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        {showIcon && <Coins className="h-4 w-4 text-muted-foreground animate-pulse" />}
        <span className="text-muted-foreground animate-pulse">---</span>
      </div>
    );
  }

  const formattedBalance = balance !== null 
    ? new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(balance)
    : '₹0';

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {showIcon && (
        <Coins className={cn(
          'text-primary',
          variant === 'compact' ? 'h-3.5 w-3.5' : 'h-4 w-4'
        )} />
      )}
      <span className={cn(
        'font-semibold text-primary',
        variant === 'compact' ? 'text-sm' : 'text-base'
      )}>
        {formattedBalance}
      </span>
    </div>
  );
}


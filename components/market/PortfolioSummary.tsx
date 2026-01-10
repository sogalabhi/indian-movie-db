'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePortfolio, type PortfolioWithStock } from '@/hooks/usePortfolio';
import { useAuth } from '@/app/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import type { MarketUser } from '@/lib/market/types';
import CoinBalance from '@/components/CoinBalance';
import { cn } from '@/lib/utils';

interface PortfolioSummaryProps {
  portfolio: PortfolioWithStock[];
}

export default function PortfolioSummary({ portfolio }: PortfolioSummaryProps) {
  const { user } = useAuth();
  const [userData, setUserData] = useState<MarketUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      try {
        const { data } = await supabase
          .from('market_users')
          .select('*')
          .eq('id', user.uid)
          .single();

        setUserData(data);
      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Calculate portfolio value
  const portfolioValue = portfolio.reduce((total, holding) => {
    if (holding.movie_stocks) {
      return total + (holding.quantity * holding.movie_stocks.current_price);
    }
    return total;
  }, 0);

  const coins = userData?.coins || 0;
  const netWorth = userData?.net_worth || 0;
  const overallPL = netWorth - 20000; // Starting bonus was 20000
  const overallPLPercent = ((netWorth - 20000) / 20000) * 100;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Portfolio Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            ₹{portfolioValue.toFixed(2)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Coins Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CoinBalance variant="default" showIcon={false} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Net Worth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            ₹{netWorth.toFixed(2)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Overall P/L
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn(
            'text-2xl font-bold',
            overallPL >= 0 ? 'text-primary' : 'text-destructive'
          )}>
            {overallPL >= 0 ? '+' : ''}₹{overallPL.toFixed(2)}
          </div>
          <div className={cn(
            'text-sm mt-1',
            overallPLPercent >= 0 ? 'text-primary' : 'text-destructive'
          )}>
            {overallPLPercent >= 0 ? '+' : ''}{overallPLPercent.toFixed(2)}%
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


'use client';

// Force dynamic rendering to avoid static generation issues with Supabase
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LeaderboardPodium from '@/components/market/LeaderboardPodium';
import LeaderboardCard from '@/components/market/LeaderboardCard';
import type { MarketUser } from '@/lib/market/types';

export default function LeaderboardPage() {
  const [users, setUsers] = useState<MarketUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('market_users')
          .select('*')
          .order('net_worth', { ascending: false })
          .limit(100);

        if (fetchError) throw fetchError;

        setUsers(data || []);
      } catch (err: any) {
        console.error('Error fetching leaderboard:', err);
        setError(err.message || 'Failed to fetch leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const top3 = users.slice(0, 3);
  const rest = users.slice(3);

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
        <p className="text-muted-foreground">Top traders by net worth</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 text-6xl">🏆</div>
          <h3 className="text-xl font-semibold mb-2">No traders yet</h3>
          <p className="text-muted-foreground">
            Be the first to start trading!
          </p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {top3.length > 0 && <LeaderboardPodium users={top3} />}

          {/* Rest of the list */}
          {rest.length > 0 && (
            <div className="mt-8 space-y-2">
              <h2 className="text-xl font-semibold mb-4">All Traders</h2>
              {rest.map((user, index) => (
                <LeaderboardCard
                  key={user.id}
                  user={user}
                  rank={index + 4}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}


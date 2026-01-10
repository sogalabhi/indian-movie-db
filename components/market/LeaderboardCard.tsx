'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { MarketUser } from '@/lib/market/types';

interface LeaderboardCardProps {
  user: MarketUser;
  rank: number;
}

export default function LeaderboardCard({ user, rank }: LeaderboardCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Rank Badge */}
          <Badge
            variant={rank <= 10 ? 'default' : 'secondary'}
            className={cn(
              'h-8 w-8 flex items-center justify-center rounded-full text-sm font-bold',
              rank <= 10 && 'bg-primary text-primary-foreground'
            )}
          >
            {rank}
          </Badge>

          {/* Avatar */}
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback>
              {user.username?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">
              {user.username || 'Anonymous'}
            </h3>
            <p className="text-sm text-muted-foreground">
              Portfolio: ₹{((user.net_worth - user.coins) || 0).toFixed(2)}
            </p>
          </div>

          {/* Net Worth */}
          <div className="text-right">
            <div className="text-lg font-bold text-primary">
              ₹{user.net_worth.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              Net Worth
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


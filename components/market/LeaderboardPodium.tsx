'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MarketUser } from '@/lib/market/types';

interface LeaderboardPodiumProps {
  users: MarketUser[];
}

export default function LeaderboardPodium({ users }: LeaderboardPodiumProps) {
  const [first, second, third] = users;

  return (
    <div className="flex items-end justify-center gap-4 mb-8">
      {/* 2nd Place */}
      {second && (
        <Card className={cn(
          'flex-1 max-w-[200px] border-2',
          'border-secondary'
        )}>
          <CardContent className="p-4 text-center">
            <div className="mb-2">
              <Medal className="h-8 w-8 mx-auto text-secondary-foreground" />
            </div>
            <Badge variant="secondary" className="mb-2">#2</Badge>
            <Avatar className="h-16 w-16 mx-auto mb-2">
              <AvatarImage src={second.avatar_url || undefined} />
              <AvatarFallback>
                {second.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <h3 className="font-semibold mb-1 line-clamp-1">
              {second.username || 'Anonymous'}
            </h3>
            <div className="text-lg font-bold text-primary">
              ₹{second.net_worth.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 1st Place */}
      {first && (
        <Card className={cn(
          'flex-1 max-w-[240px] border-2 scale-110',
          'border-primary bg-primary/5'
        )}>
          <CardContent className="p-6 text-center">
            <div className="mb-2">
              <Trophy className="h-12 w-12 mx-auto text-primary" />
            </div>
            <Badge className="mb-2 bg-primary text-primary-foreground">#1</Badge>
            <Avatar className="h-20 w-20 mx-auto mb-3 border-2 border-primary">
              <AvatarImage src={first.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {first.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <h3 className="font-bold text-lg mb-2 line-clamp-1">
              {first.username || 'Anonymous'}
            </h3>
            <div className="text-2xl font-bold text-primary">
              ₹{first.net_worth.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3rd Place */}
      {third && (
        <Card className={cn(
          'flex-1 max-w-[200px] border-2',
          'border-secondary'
        )}>
          <CardContent className="p-4 text-center">
            <div className="mb-2">
              <Award className="h-8 w-8 mx-auto text-secondary-foreground" />
            </div>
            <Badge variant="secondary" className="mb-2">#3</Badge>
            <Avatar className="h-16 w-16 mx-auto mb-2">
              <AvatarImage src={third.avatar_url || undefined} />
              <AvatarFallback>
                {third.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <h3 className="font-semibold mb-1 line-clamp-1">
              {third.username || 'Anonymous'}
            </h3>
            <div className="text-lg font-bold text-primary">
              ₹{third.net_worth.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


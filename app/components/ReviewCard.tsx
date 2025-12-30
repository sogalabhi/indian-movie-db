'use client';

import { Star, Calendar, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getAvatarColor, getInitials } from '@/lib/avatar-utils';

interface ReviewCardProps {
  review: {
    id: string;
    userId: string;
    rating: number;
    body?: string;
    watchedAt: Date | string | { toMillis?: () => number; getTime?: () => number };
    likesCount: number;
    createdAt: Date | string | { toMillis?: () => number; getTime?: () => number };
    user: {
      username: string;
      avatarUrl?: string | null;
    };
  };
  currentUserId?: string;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  // Format date helper
  const formatDate = (date: Date | string | { toMillis?: () => number; getTime?: () => number }) => {
    try {
      let dateObj: Date;
      
      if (typeof date === 'object' && 'toMillis' in date && typeof date.toMillis === 'function') {
        dateObj = new Date(date.toMillis());
      } else if (typeof date === 'object' && 'getTime' in date && typeof date.getTime === 'function') {
        dateObj = new Date(date.getTime());
      } else if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else {
        return 'Unknown date';
      }

      if (isNaN(dateObj.getTime())) {
        return 'Unknown date';
      }

      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      return 'Unknown date';
    }
  };

  const initials = getInitials(review.user.username);
  const avatarColor = getAvatarColor(review.user.username);

  return (
    <Card className="glass-card animate-scale-in">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start gap-3 md:gap-4">
          {/* Avatar */}
          <Avatar className="h-10 w-10 md:h-12 md:w-12 flex-shrink-0">
            <AvatarImage src={review.user.avatarUrl || undefined} alt={review.user.username} />
            <AvatarFallback 
              className="font-semibold text-white"
              style={{ backgroundColor: avatarColor }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Review Content */}
          <div className="flex-1 min-w-0">
            {/* Header: Username and Rating */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm md:text-base truncate">{review.user.username}</h4>
                <div className="flex items-center gap-2 mt-1">
                  {/* Star Rating */}
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                      <Star
                        key={value}
                        className={`h-3 w-3 md:h-4 md:w-4 ${
                          value <= review.rating
                            ? 'text-yellow-500 fill-current'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs md:text-sm font-medium text-muted-foreground">
                    {review.rating}/10
                  </span>
                </div>
              </div>
              
              {/* Likes Count */}
              {review.likesCount > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                  <Heart className="h-3 w-3 fill-current" />
                  {review.likesCount}
                </Badge>
              )}
            </div>

            {/* Review Text */}
            {review.body && (
              <p className="text-sm md:text-base text-foreground mb-3 whitespace-pre-wrap break-words">
                {review.body}
              </p>
            )}

            {/* Footer: Dates */}
            <div className="flex items-center gap-4 text-xs md:text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                <span>Watched {formatDate(review.watchedAt)}</span>
              </div>
              <span>•</span>
              <span>Reviewed {formatDate(review.createdAt)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


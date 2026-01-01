'use client';

import { useState, useEffect } from 'react';
import { Star, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getAvatarColor, getInitials } from '@/lib/avatar-utils';
import LikeButton from './LikeButton';
import HelpfulnessButtons from './HelpfulnessButtons';
import ReviewCommentsSection from './ReviewCommentsSection';
import { useAuth } from '@/app/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface ReviewCardProps {
  review: {
    id: string;
    userId: string;
    rating: number;
    body?: string;
    watchedAt: Date | string | { toMillis?: () => number; getTime?: () => number };
    likesCount: number;
    helpfulCount?: number;
    notHelpfulCount?: number;
    commentsCount?: number;
    createdAt: Date | string | { toMillis?: () => number; getTime?: () => number };
    user: {
      username: string;
      avatarUrl?: string | null;
    };
  };
  currentUserId?: string;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount || 0);
  const [notHelpfulCount, setNotHelpfulCount] = useState(review.notHelpfulCount || 0);
  const [likesCount, setLikesCount] = useState(review.likesCount);

  // Fetch like and helpfulness status
  useEffect(() => {
    if (!user) return;

    const fetchStatus = async () => {
      try {
        // Fetch like status
        const likeResponse = await fetch(`/api/reviews/${review.id}/like`);
        if (likeResponse.ok) {
          const likeData = await likeResponse.json();
          setLiked(likeData.liked);
        }

        // Fetch helpfulness status
        const helpfulResponse = await fetch(`/api/reviews/${review.id}/helpful`);
        if (helpfulResponse.ok) {
          const helpfulData = await helpfulResponse.json();
          setHelpful(helpfulData.helpful);
        }
      } catch (error) {
        console.error('Error fetching review status:', error);
      }
    };

    fetchStatus();
  }, [user, review.id]);

  // Calculate helpfulness percentage
  const totalHelpfulnessVotes = helpfulCount + notHelpfulCount;
  const helpfulnessPercentage = totalHelpfulnessVotes > 0 
    ? Math.round((helpfulCount / totalHelpfulnessVotes) * 100) 
    : 0;
  const isMostHelpful = helpfulnessPercentage >= 80 && totalHelpfulnessVotes >= 5;

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
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm md:text-base truncate">{review.user.username}</h4>
                  {isMostHelpful && (
                    <Badge variant="default" className="text-xs">
                      Most Helpful
                    </Badge>
                  )}
                </div>
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
            </div>

            {/* Review Text */}
            {review.body && (
              <p className="text-sm md:text-base text-foreground mb-3 whitespace-pre-wrap break-words">
                {review.body}
              </p>
            )}

            {/* Footer: Dates */}
            <div className="flex items-center gap-4 text-xs md:text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                <span>Watched {formatDate(review.watchedAt)}</span>
              </div>
              <span>•</span>
              <span>Reviewed {formatDate(review.createdAt)}</span>
            </div>

            {/* Action Buttons: Like, Helpfulness, Comments */}
            <div className="flex items-center gap-3 flex-wrap pt-3 border-t border-border">
              <LikeButton
                targetId={review.id}
                targetType="review"
                initialLiked={liked}
                initialCount={likesCount}
                size="sm"
                onLikeChange={(newLiked, newCount) => {
                  setLiked(newLiked);
                  setLikesCount(newCount);
                }}
              />

              <HelpfulnessButtons
                reviewId={review.id}
                initialHelpful={helpful}
                initialHelpfulCount={helpfulCount}
                initialNotHelpfulCount={notHelpfulCount}
                onVoteChange={(newHelpful, newHelpfulCount, newNotHelpfulCount) => {
                  setHelpful(newHelpful);
                  setHelpfulCount(newHelpfulCount);
                  setNotHelpfulCount(newNotHelpfulCount);
                }}
              />

              <ReviewCommentsSection
                reviewId={review.id}
                reviewSummary={{
                  username: review.user.username,
                  rating: review.rating,
                  body: review.body,
                }}
                commentsCount={review.commentsCount || 0}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


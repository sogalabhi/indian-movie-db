'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type LikeTargetType = 'review' | 'comment' | 'article';

interface LikeButtonProps {
  targetId: string;
  targetType: LikeTargetType;
  initialLiked: boolean;
  initialCount: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  reviewId?: string; // Required for comment type
  onLikeChange?: (liked: boolean, count: number) => void;
}

export default function LikeButton({
  targetId,
  targetType,
  initialLiked,
  initialCount,
  size = 'md',
  className,
  reviewId,
  onLikeChange,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);

  // Sync with props if they change
  useEffect(() => {
    setLiked(initialLiked);
    setCount(initialCount);
  }, [initialLiked, initialCount]);

  const handleLike = async () => {
    if (loading) return;

    // Optimistic update
    const previousLiked = liked;
    const previousCount = count;
    const newLiked = !liked;
    const newCount = newLiked ? count + 1 : Math.max(0, count - 1);

    setLiked(newLiked);
    setCount(newCount);
    setLoading(true);
    setAnimating(true);

    // Trigger animation
    setTimeout(() => setAnimating(false), 300);

    try {
      const method = newLiked ? 'POST' : 'DELETE';
      const endpoint = getLikeEndpoint(targetType, targetId, reviewId);

      const response = await fetch(endpoint, {
        method,
      });

      if (!response.ok) {
        throw new Error('Failed to update like');
      }

      const data = await response.json();
      
      // Update with server response
      setLiked(data.liked);
      setCount(data.likesCount);

      // Toast notification
      if (data.liked) {
        toast.success(getLikeMessage(targetType, true));
      } else {
        toast.success(getLikeMessage(targetType, false));
      }

      // Callback
      if (onLikeChange) {
        onLikeChange(data.liked, data.likesCount);
      }
    } catch (error: any) {
      // Rollback on error
      setLiked(previousLiked);
      setCount(previousCount);
      toast.error('Failed to update like. Please try again.');
      console.error('Error updating like:', error);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const buttonSizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10',
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleLike}
      disabled={loading}
      className={cn(
        'transition-smooth flex items-center gap-1.5',
        buttonSizeClasses[size],
        className
      )}
      aria-label={liked ? 'Unlike' : 'Like'}
    >
      <Heart
        className={cn(
          sizeClasses[size],
          'transition-all duration-300',
          liked
            ? 'text-red-500 fill-current'
            : 'text-muted-foreground',
          animating && 'scale-125'
        )}
      />
      {count > 0 && (
        <span className="text-xs md:text-sm font-medium">
          {count}
        </span>
      )}
    </Button>
  );
}

function getLikeEndpoint(targetType: LikeTargetType, targetId: string, reviewId?: string): string {
  switch (targetType) {
    case 'review':
      return `/api/reviews/${targetId}/like`;
    case 'comment':
      if (!reviewId) {
        throw new Error('reviewId is required for comment likes');
      }
      return `/api/reviews/${reviewId}/comments/${targetId}/like`;
    case 'article':
      return `/api/articles/${targetId}/like`;
    default:
      throw new Error(`Unknown target type: ${targetType}`);
  }
}

function getLikeMessage(targetType: LikeTargetType, liked: boolean): string {
  const targetName = targetType === 'review' ? 'Review' : targetType === 'comment' ? 'Comment' : 'Article';
  return liked ? `${targetName} liked!` : `${targetName} unliked!`;
}


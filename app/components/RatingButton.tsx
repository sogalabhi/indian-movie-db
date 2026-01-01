'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Loader2 } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import RatingDialog from './RatingDialog';

interface RatingButtonProps {
  movieId: string | number;
  movieTitle: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showBadge?: boolean; // Show rating badge on card
  onSave?: () => void;
  lazyCheck?: boolean; // Only check rating on hover/click, not on mount
}

interface Review {
  id: string;
  rating: number;
  body?: string;
  watchedAt: string | Date;
}

export default function RatingButton({
  movieId,
  movieTitle,
  variant = 'secondary',
  size = 'icon',
  className = '',
  showBadge = false,
  onSave,
  lazyCheck = false, // Default to false for backward compatibility
}: RatingButtonProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [hasRating, setHasRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [checking, setChecking] = useState(!lazyCheck); // Only check immediately if not lazy
  const [hasChecked, setHasChecked] = useState(false);
  const [existingReview, setExistingReview] = useState<Review | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Check if movie has rating (only if not lazy or if user is available)
  useEffect(() => {
    if (lazyCheck || hasChecked) {
      return; // Skip if lazy check is enabled or already checked
    }

    const checkRating = async () => {
      if (!user || authLoading) {
        setChecking(false);
        return;
      }

      try {
        const response = await fetch(`/api/reviews/user/${movieId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.review) {
            setHasRating(true);
            setRating(data.review.rating);
            setExistingReview({
              id: data.review.id,
              rating: data.review.rating,
              body: data.review.body,
              watchedAt: data.review.watchedAt,
            });
          } else {
            setHasRating(false);
            setRating(0);
            setExistingReview(undefined);
          }
        }
      } catch (error) {
        console.error('Error checking rating:', error);
      } finally {
        setChecking(false);
        setHasChecked(true);
      }
    };

    checkRating();
  }, [user, authLoading, movieId, lazyCheck, hasChecked]);

  // Lazy check on hover or click
  const handleInteraction = async () => {
    if (lazyCheck && !hasChecked && user && !authLoading) {
      setChecking(true);
      try {
        const response = await fetch(`/api/reviews/user/${movieId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.review) {
            setHasRating(true);
            setRating(data.review.rating);
            setExistingReview({
              id: data.review.id,
              rating: data.review.rating,
              body: data.review.body,
              watchedAt: data.review.watchedAt,
            });
          } else {
            setHasRating(false);
            setRating(0);
            setExistingReview(undefined);
          }
        }
      } catch (error) {
        console.error('Error checking rating:', error);
      } finally {
        setChecking(false);
        setHasChecked(true);
      }
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Trigger lazy check if needed
    if (lazyCheck && !hasChecked) {
      handleInteraction();
    }
    
    if (!user) {
      router.push('/login');
      return;
    }

    setDialogOpen(true);
  };

  const handleSave = () => {
    setHasRating(true);
    // Refetch review to get updated data
    fetch(`/api/reviews/${movieId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.review) {
          setRating(data.review.rating);
          setExistingReview({
            id: data.review.id,
            rating: data.review.rating,
            body: data.review.body,
            watchedAt: data.review.watchedAt,
          });
        }
      })
      .catch((err) => console.error('Error fetching review:', err));
    
    if (onSave) {
      onSave();
    }
  };

  if (checking || authLoading) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
      </Button>
    );
  }

  // If showBadge is true and has rating, show badge instead of button
  if (showBadge && hasRating) {
    return (
      <Badge className="glass-card text-xs md:text-sm px-2 py-1 bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
        <Star className="w-3 h-3 md:w-4 md:h-4 fill-current mr-1" />
        {rating}/10
      </Badge>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        onMouseEnter={lazyCheck ? handleInteraction : undefined}
        className={`${className} transition-smooth hover-scale`}
        title={hasRating ? `Update rating (${rating}/10)` : 'Rate this movie'}
      >
        {hasRating ? (
          <>
            <Star className="h-3 w-3 md:h-4 md:w-4 text-yellow-500 fill-current" />
            {size !== 'icon' && <span className="ml-1">{rating}/10</span>}
          </>
        ) : (
          <Star className="h-3 w-3 md:h-4 md:w-4" />
        )}
      </Button>

      <RatingDialog
        movieId={movieId}
        movieTitle={movieTitle}
        existingReview={existingReview}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
      />
    </>
  );
}


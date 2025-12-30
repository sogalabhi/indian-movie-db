'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Eye } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import RatingDialog from './RatingDialog';

interface MarkWatchedButtonProps {
  movieId: string | number;
  movieTitle: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onSave?: () => void;
}

interface Review {
  id: string;
  rating: number;
  body?: string;
  watchedAt: string | Date;
}

export default function MarkWatchedButton({
  movieId,
  movieTitle,
  variant = 'outline',
  size = 'default',
  className = '',
  onSave,
}: MarkWatchedButtonProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isWatched, setIsWatched] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [existingReview, setExistingReview] = useState<Review | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Check if movie is already watched
  useEffect(() => {
    const checkWatched = async () => {
      if (!user || authLoading) {
        setChecking(false);
        return;
      }

      try {
        const response = await fetch(`/api/reviews/${movieId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.review) {
            setIsWatched(true);
            setExistingReview({
              id: data.review.id,
              rating: data.review.rating,
              body: data.review.body,
              watchedAt: data.review.watchedAt,
            });
          } else {
            setIsWatched(false);
            setExistingReview(undefined);
          }
        }
      } catch (error) {
        console.error('Error checking watched status:', error);
      } finally {
        setChecking(false);
      }
    };

    checkWatched();
  }, [user, authLoading, movieId]);

  const handleClick = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    setIsWatched(true);
    // Refetch review to get updated data
    fetch(`/api/reviews/${movieId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.review) {
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
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={loading}
        className={`${className} transition-smooth hover-scale`}
        title={isWatched ? 'Update rating' : 'Mark as watched'}
      >
        {isWatched ? (
          <>
            <Check className="h-4 w-4" />
            {size !== 'icon' && <span className="ml-2">Watched</span>}
          </>
        ) : (
          <>
            <Eye className="h-4 w-4" />
            {size !== 'icon' && <span className="ml-2">Mark as Watched</span>}
          </>
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


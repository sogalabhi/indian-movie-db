'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Loader2, Calendar } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface Review {
  id?: string;
  rating: number;
  body?: string;
  watchedAt: Date | string | { toMillis: () => number } | { getTime: () => number };
}

interface RatingDialogProps {
  movieId: string | number;
  movieTitle: string;
  existingReview?: Review;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
}

export default function RatingDialog({
  movieId,
  movieTitle,
  existingReview,
  open,
  onOpenChange,
  onSave,
}: RatingDialogProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewBody, setReviewBody] = useState(existingReview?.body || '');
  // Initialize with a safe default, parse date in useEffect to avoid impure function calls during render
  const [watchedDate, setWatchedDate] = useState(() => {
    // Return a safe default during render - actual date will be set in useEffect
    return new Date().toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [showWatchlistPrompt, setShowWatchlistPrompt] = useState(false);
  const [removingFromWatchlist, setRemovingFromWatchlist] = useState(false);

  // Check if movie is in watchlist
  useEffect(() => {
    if (!open || !user) return;

    const checkWatchlist = async () => {
      try {
        const response = await fetch(`/api/watchlist/${movieId}`);
        if (response.ok) {
          const data = await response.json();
          setInWatchlist(data.inWatchlist);
        }
      } catch (error) {
        console.error('Error checking watchlist:', error);
      }
    };

    checkWatchlist();
  }, [open, user, movieId]);

  // Reset form when dialog opens/closes or existingReview changes
  useEffect(() => {
    if (open) {
      // Use setTimeout to avoid synchronous setState in effect
      const timeoutId = setTimeout(() => {
        if (existingReview) {
          setRating(existingReview.rating);
        setReviewBody(existingReview.body || '');
        
        // Handle date conversion safely
        try {
          let date: Date;
          const watchedAt = existingReview.watchedAt;
          
          if (typeof watchedAt === 'object' && 'toMillis' in watchedAt && typeof watchedAt.toMillis === 'function') {
            date = new Date(watchedAt.toMillis());
          } else if (watchedAt instanceof Date) {
            date = new Date(watchedAt.getTime());
          } else if (typeof watchedAt === 'object' && 'getTime' in watchedAt && typeof watchedAt.getTime === 'function') {
            date = new Date(watchedAt.getTime());
          } else if (typeof watchedAt === 'string') {
            date = new Date(watchedAt);
          } else {
            date = new Date(watchedAt as any);
          }
          
          if (!isNaN(date.getTime())) {
            setWatchedDate(date.toISOString().split('T')[0]);
          } else {
            setWatchedDate(new Date().toISOString().split('T')[0]);
          }
        } catch (error) {
          console.error('Error parsing watchedAt date:', error);
          setWatchedDate(new Date().toISOString().split('T')[0]);
        }
      } else {
        setRating(0);
        setReviewBody('');
        setWatchedDate(new Date().toISOString().split('T')[0]);
      }
      setError(null);
      setShowWatchlistPrompt(false);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [open, existingReview]);

  const handleSave = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (rating === 0) {
      setError('Please select a rating (1-10 stars)');
      return;
    }

    // Check if in watchlist and show prompt
    if (inWatchlist && !existingReview) {
      setShowWatchlistPrompt(true);
      return;
    }

    await saveReview();
  };

  const saveReview = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movieId: String(movieId),
          rating,
          body: reviewBody.trim() || undefined,
          watchedAt: watchedDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save review');
      }

      // If user chose to remove from watchlist, do it now
      if (showWatchlistPrompt && removingFromWatchlist) {
        try {
          await fetch(`/api/watchlist/${movieId}`, {
            method: 'DELETE',
          });
        } catch (err) {
          console.error('Error removing from watchlist:', err);
        }
      }

      toast.success(existingReview ? 'Rating updated successfully!' : 'Movie marked as watched!');
      
      if (onSave) {
        onSave();
      }

      onOpenChange(false);
    } catch (err: any) {
      console.error('Error saving review:', err);
      const errorMessage = err.message || 'Failed to save review';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleWatchlistChoice = async (remove: boolean) => {
    setRemovingFromWatchlist(remove);
    setShowWatchlistPrompt(false);
    if (remove) {
      // Remove from watchlist first, then save review
      try {
        await fetch(`/api/watchlist/${movieId}`, {
          method: 'DELETE',
        });
        setInWatchlist(false);
      } catch (err) {
        console.error('Error removing from watchlist:', err);
      }
    }
    await saveReview();
  };

  const handleLogin = () => {
    onOpenChange(false);
    router.push('/login');
  };

  if (authLoading) {
    return null;
  }

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="glass-card animate-scale-in">
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              You need to be logged in to rate movies.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="transition-smooth">
              Cancel
            </Button>
            <Button onClick={handleLogin} className="transition-smooth">Login</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card animate-scale-in max-w-md">
        <DialogHeader>
          <DialogTitle>Rate {movieTitle}</DialogTitle>
          <DialogDescription>
            {existingReview ? 'Update your rating and review' : 'Mark as watched and rate this movie'}
          </DialogDescription>
        </DialogHeader>

        {showWatchlistPrompt && (
          <Alert className="glass-card border-primary/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This movie is in your watchlist. Would you like to remove it?
            </AlertDescription>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleWatchlistChoice(false)}
                className="transition-smooth"
              >
                Keep in Watchlist
              </Button>
              <Button
                size="sm"
                onClick={() => handleWatchlistChoice(true)}
                className="transition-smooth"
              >
                Remove from Watchlist
              </Button>
            </div>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="glass-card">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Star Rating */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Rating *</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoveredRating(value)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                  aria-label={`Rate ${value} out of 10`}
                >
                  <Star
                    className={`h-6 w-6 md:h-7 md:w-7 transition-colors ${
                      value <= (hoveredRating || rating)
                        ? 'text-yellow-500 fill-current'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm font-medium text-muted-foreground">
                  {rating}/10
                </span>
              )}
            </div>
          </div>

          {/* Watched Date */}
          <div>
            <Label htmlFor="watched-date" className="text-sm font-medium mb-2 block">
              Watched Date
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="watched-date"
                type="date"
                value={watchedDate}
                onChange={(e) => setWatchedDate(e.target.value)}
                className="pl-10 transition-smooth"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Review Text */}
          <div>
            <Label htmlFor="review-body" className="text-sm font-medium mb-2 block">
              Review (Optional)
            </Label>
            <textarea
              id="review-body"
              value={reviewBody}
              onChange={(e) => setReviewBody(e.target.value)}
              placeholder="Write your thoughts about this movie..."
              rows={4}
              className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="transition-smooth"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || rating === 0}
            className="transition-smooth"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


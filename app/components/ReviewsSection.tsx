'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReviewCard from './ReviewCard';
import RatingDialog from './RatingDialog';

interface Review {
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
}

interface ReviewsSectionProps {
  movieId: string | number;
  movieTitle: string;
}

export default function ReviewsSection({ movieId, movieTitle }: ReviewsSectionProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating_high' | 'rating_low' | 'likes'>('newest');
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '10',
          sortBy,
        });

        const response = await fetch(`/api/reviews/movie/${movieId}?${params.toString()}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch reviews');
        }

        const data = await response.json();
        setReviews(data.reviews || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } catch (err: any) {
        console.error('Error fetching reviews:', err);
        setError(err.message || 'Failed to load reviews');
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [movieId, page, sortBy]);

  // Check if current user has reviewed
  useEffect(() => {
    const checkUserReview = async () => {
      if (!user) {
        setUserHasReviewed(false);
        return;
      }

      try {
        const response = await fetch(`/api/reviews/${movieId}`);
        if (response.ok) {
          const data = await response.json();
          setUserHasReviewed(!!data.review);
        }
      } catch (error) {
        console.error('Error checking user review:', error);
      }
    };

    checkUserReview();
  }, [user, movieId]);

  const handleSortChange = (value: string) => {
    setSortBy(value as typeof sortBy);
    setPage(1); // Reset to first page when sorting changes
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      // Scroll to top of reviews section
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleReviewSaved = () => {
    // Refresh reviews after user writes a review
    setPage(1);
    setUserHasReviewed(true);
    // The useEffect will automatically refetch
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          <h2 className="text-xl md:text-2xl font-bold">
            Reviews
            {total > 0 && (
              <span className="text-muted-foreground font-normal ml-2">
                ({total} {total === 1 ? 'review' : 'reviews'})
              </span>
            )}
          </h2>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Write Review Button */}
          {user && !userHasReviewed && (
            <Button
              onClick={() => setDialogOpen(true)}
              className="transition-smooth flex-shrink-0"
              size="sm"
            >
              Write Review
            </Button>
          )}

          {/* Sort Dropdown */}
          {total > 0 && (
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="rating_high">Highest Rating</SelectItem>
                <SelectItem value="rating_low">Lowest Rating</SelectItem>
                <SelectItem value="likes">Most Liked</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="glass-card">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {!loading && total === 0 && (
        <Card className="glass-card">
          <CardContent className="p-8 md:p-12 text-center">
            <MessageSquare className="w-12 h-12 md:w-16 md:h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg md:text-xl font-bold mb-2">No reviews yet</h3>
            <p className="text-muted-foreground mb-4 text-sm md:text-base">
              Be the first to review this movie!
            </p>
            {user && !userHasReviewed && (
              <Button onClick={() => setDialogOpen(true)} className="transition-smooth">
                Write the First Review
              </Button>
            )}
            {!user && (
              <p className="text-sm text-muted-foreground">
                <a href="/login" className="text-primary hover:underline">
                  Login
                </a>{' '}
                to write a review
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {reviews.length > 0 && (
        <div className="space-y-3 md:space-y-4">
          {reviews.map((review, index) => (
            <div
              key={review.id}
              style={{ animationDelay: `${index * 50}ms` }}
              className="animate-scale-in"
            >
              <ReviewCard review={review} currentUserId={user?.uid} />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || loading}
              className="transition-smooth"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages || loading}
              className="transition-smooth"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Rating Dialog */}
      <RatingDialog
        movieId={movieId}
        movieTitle={movieTitle}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleReviewSaved}
      />
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, ArrowLeft, Calendar, ChevronLeft, ChevronRight, Star, Search, Filter, BarChart3, TrendingUp } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import WatchlistButton from '@/app/components/WatchlistButton';
import RatingButton from '@/app/components/RatingButton';
import { useComparison } from '@/app/contexts/ComparisonContext';
import { Scale, Check, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Review {
  id: string;
  userId: string;
  movieId: string;
  rating: number;
  body?: string;
  watchedAt: any;
  createdAt: any;
  updatedAt: any;
  movie?: {
    id: number;
    title: string;
    poster_path: string | null;
    vote_average: number;
    release_date: string;
    genres?: Array<{ id: number; name: string }>;
    [key: string]: any;
  };
}

export default function WatchedPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { addToCompare, isInComparison, canAddMore } = useComparison();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [addingMovieId, setAddingMovieId] = useState<number | null>(null);

  // Filters and sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'title'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch watched history
  useEffect(() => {
    const fetchReviews = async () => {
      if (!user || authLoading) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/reviews');
        
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch watched history');
        }

        const data = await response.json();
        const reviewsList = data.reviews || [];

        // Fetch movie details for each review
        const moviePromises = reviewsList.map(async (review: Review) => {
          try {
            const movieResponse = await fetch(`/api/movies/${review.movieId}`);
            if (movieResponse.ok) {
              const movieData = await movieResponse.json();
              return { ...review, movie: movieData };
            }
          } catch (err) {
            console.error(`Error fetching movie ${review.movieId}:`, err);
          }
          return review;
        });

        const reviewsWithMovies = await Promise.all(moviePromises);
        setReviews(reviewsWithMovies);
      } catch (err: any) {
        console.error('Error fetching watched history:', err);
        setError(err.message || 'Failed to load watched history');
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [user, authLoading, router]);

  // Filter and sort reviews
  const filteredAndSortedReviews = reviews
    .filter((review) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const title = review.movie?.title?.toLowerCase() || '';
        if (!title.includes(query)) return false;
      }

      // Rating filter
      if (ratingFilter !== 'all') {
        const rating = review.rating;
        switch (ratingFilter) {
          case '1-3':
            if (rating < 1 || rating > 3) return false;
            break;
          case '4-6':
            if (rating < 4 || rating > 6) return false;
            break;
          case '7-8':
            if (rating < 7 || rating > 8) return false;
            break;
          case '9-10':
            if (rating < 9 || rating > 10) return false;
            break;
        }
      }

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          const aTime = a.watchedAt?.toMillis?.() || a.watchedAt?.getTime?.() || new Date(a.watchedAt).getTime() || 0;
          const bTime = b.watchedAt?.toMillis?.() || b.watchedAt?.getTime?.() || new Date(b.watchedAt).getTime() || 0;
          comparison = bTime - aTime;
          break;
        case 'rating':
          comparison = b.rating - a.rating;
          break;
        case 'title':
          const aTitle = a.movie?.title || '';
          const bTitle = b.movie?.title || '';
          comparison = aTitle.localeCompare(bTitle);
          break;
      }

      return sortOrder === 'asc' ? -comparison : comparison;
    });

  // Calculate statistics
  const stats = {
    total: reviews.length,
    averageRating: reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0,
    ratingDistribution: {
      '1-3': reviews.filter((r) => r.rating >= 1 && r.rating <= 3).length,
      '4-6': reviews.filter((r) => r.rating >= 4 && r.rating <= 6).length,
      '7-8': reviews.filter((r) => r.rating >= 7 && r.rating <= 8).length,
      '9-10': reviews.filter((r) => r.rating >= 9 && r.rating <= 10).length,
    },
    genres: (() => {
      const genreCounts: Record<string, number> = {};
      reviews.forEach((review) => {
        review.movie?.genres?.forEach((genre) => {
          genreCounts[genre.name] = (genreCounts[genre.name] || 0) + 1;
        });
      });
      return Object.entries(genreCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);
    })(),
  };

  const handleDelete = async (reviewId: string, movieId: string) => {
    setRemoving(reviewId);
    try {
      const response = await fetch(`/api/reviews/user/${movieId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
        toast.success('Removed from watched history');
      } else {
        const error = await response.json();
        console.error('Error deleting review:', error);
        toast.error(error.error || 'Failed to remove from watched history');
      }
    } catch (err) {
      console.error('Error deleting review:', err);
      toast.error('Failed to remove from watched history');
    } finally {
      setRemoving(null);
    }
  };

  const handleAddToCompare = async (e: React.MouseEvent, movie: any) => {
    e.preventDefault();
    e.stopPropagation();

    if (!canAddMore || isInComparison(movie.id)) return;

    setAddingMovieId(movie.id);

    try {
      const response = await fetch(`/api/movies/${movie.id}`);
      if (!response.ok) throw new Error('Failed to fetch movie details');
      
      const fullMovie = await response.json();

      addToCompare({
        id: fullMovie.id,
        title: fullMovie.title,
        poster_path: fullMovie.poster_path,
        vote_average: fullMovie.vote_average,
        release_date: fullMovie.release_date,
        overview: fullMovie.overview || '',
        runtime: fullMovie.runtime || 0,
        genres: fullMovie.genres || [],
        budget: fullMovie.budget || 0,
        revenue: fullMovie.revenue || 0,
        backdrop_path: fullMovie.backdrop_path,
      });
    } catch (error) {
      console.error('Error fetching movie details:', error);
    } finally {
      setAddingMovieId(null);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-8 md:h-10 w-48 md:w-64 mb-6 md:mb-8 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <Card key={i} className="overflow-hidden glass-card animate-pulse">
                <div className="h-[210px] md:h-[270px] lg:h-[300px]">
                  <Skeleton className="w-full h-full" />
                </div>
                <CardContent className="p-3 md:p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8 animate-fade-in">
          <div className="flex items-center gap-3 md:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="rounded-full transition-smooth hover-scale"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Eye className="w-6 h-6 md:w-8 md:h-8" />
                Watched History
              </h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                {filteredAndSortedReviews.length} of {stats.total} {stats.total === 1 ? 'movie' : 'movies'} watched
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Section */}
        {reviews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8 animate-fade-in">
            <Card className="glass-card">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Watched</p>
                    <p className="text-2xl md:text-3xl font-bold">{stats.total}</p>
                  </div>
                  <Eye className="w-8 h-8 md:w-10 md:h-10 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Average Rating</p>
                    <p className="text-2xl md:text-3xl font-bold">{stats.averageRating.toFixed(1)}/10</p>
                  </div>
                  <TrendingUp className="w-8 h-8 md:w-10 md:h-10 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Top Rated (9-10)</p>
                    <p className="text-2xl md:text-3xl font-bold">{stats.ratingDistribution['9-10']}</p>
                  </div>
                  <Star className="w-8 h-8 md:w-10 md:h-10 text-yellow-500 fill-current opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Rating Distribution</p>
                    <div className="flex gap-1 mt-2">
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-yellow-500 h-full"
                          style={{ width: `${(stats.ratingDistribution['9-10'] / stats.total) * 100}%` }}
                        />
                      </div>
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-full"
                          style={{ width: `${(stats.ratingDistribution['7-8'] / stats.total) * 100}%` }}
                        />
                      </div>
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full"
                          style={{ width: `${(stats.ratingDistribution['4-6'] / stats.total) * 100}%` }}
                        />
                      </div>
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-red-500 h-full"
                          style={{ width: `${(stats.ratingDistribution['1-3'] / stats.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 md:mb-8 animate-fade-in">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5 z-10" />
            <Input
              type="text"
              placeholder="Search movies..."
              className="pl-10 transition-smooth"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="9-10">9-10 Stars</SelectItem>
              <SelectItem value="7-8">7-8 Stars</SelectItem>
              <SelectItem value="4-6">4-6 Stars</SelectItem>
              <SelectItem value="1-3">1-3 Stars</SelectItem>
            </SelectContent>
          </Select>

          <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
            const [by, order] = value.split('-');
            setSortBy(by as 'date' | 'rating' | 'title');
            setSortOrder(order as 'asc' | 'desc');
          }}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Date (Newest)</SelectItem>
              <SelectItem value="date-asc">Date (Oldest)</SelectItem>
              <SelectItem value="rating-desc">Rating (High to Low)</SelectItem>
              <SelectItem value="rating-asc">Rating (Low to High)</SelectItem>
              <SelectItem value="title-asc">Title (A-Z)</SelectItem>
              <SelectItem value="title-desc">Title (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mb-6 glass-card animate-fade-in">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {!loading && reviews.length === 0 && (
          <div className="text-center py-12 md:py-20 animate-fade-in">
            <Eye className="w-12 h-12 md:w-16 md:h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl md:text-2xl font-bold mb-2">No watched movies yet</h2>
            <p className="text-muted-foreground mb-6 text-sm md:text-base">
              Start rating movies to build your watched history!
            </p>
            <Button asChild className="transition-smooth">
              <Link href="/">Browse Movies</Link>
            </Button>
          </div>
        )}

        {/* No Results from Filters */}
        {!loading && reviews.length > 0 && filteredAndSortedReviews.length === 0 && (
          <div className="text-center py-12 md:py-20 animate-fade-in">
            <Search className="w-12 h-12 md:w-16 md:h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl md:text-2xl font-bold mb-2">No movies match your filters</h2>
            <p className="text-muted-foreground mb-6 text-sm md:text-base">
              Try adjusting your search or filter criteria.
            </p>
            <Button onClick={() => { setSearchQuery(''); setRatingFilter('all'); }} className="transition-smooth">
              Clear Filters
            </Button>
          </div>
        )}

        {/* Watched Movies Grid */}
        {filteredAndSortedReviews.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {filteredAndSortedReviews.map((review, index) => {
              const movie = review.movie;
              if (!movie) {
                return (
                  <Card key={review.id} className="overflow-hidden glass-card animate-pulse">
                    <div className="h-[210px] md:h-[270px] lg:h-[300px]">
                      <Skeleton className="w-full h-full" />
                    </div>
                    <CardContent className="p-3 md:p-4">
                      <Skeleton className="h-4 w-full mb-2" />
                    </CardContent>
                  </Card>
                );
              }

              const inComparison = isInComparison(movie.id);
              const isAdding = addingMovieId === movie.id;
              const disabled = !canAddMore && !inComparison;

              return (
                <div 
                  key={review.id} 
                  className="relative group animate-scale-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <Link href={`/movie/${movie.id}`} className="block h-full">
                    <Card className="glass-card overflow-hidden hover-scale cursor-pointer h-full flex flex-col">
                      <div className="relative">
                        <div className="h-[210px] md:h-[270px] lg:h-[300px] w-full overflow-hidden">
                          <img
                            src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
                            alt={movie.title}
                            className="w-full h-full object-cover transition-smooth"
                          />
                        </div>
                        {/* Rating Badge */}
                        <Badge className="absolute top-2 left-2 glass-card text-xs md:text-sm px-2 py-1 bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                          <Star className="w-3 h-3 md:w-4 md:h-4 fill-current mr-1" />
                          {review.rating}/10
                        </Badge>
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Badge variant="secondary" className="text-xs md:text-sm px-3 md:px-4 py-1 glass-card">
                            View Details
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-3 md:p-4 flex-grow flex flex-col justify-end">
                        <h2 className="font-bold text-sm md:text-lg truncate mb-2" title={movie.title}>
                          {movie.title}
                        </h2>
                        <div className="flex justify-between items-center text-xs md:text-sm text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 md:h-4 md:w-4 text-yellow-500 fill-current" />
                            {movie.vote_average?.toFixed(1)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                            {review.watchedAt && (() => {
                              try {
                                let date: Date;
                                if (review.watchedAt?.toMillis) {
                                  date = new Date(review.watchedAt.toMillis());
                                } else if (review.watchedAt?.getTime) {
                                  date = new Date(review.watchedAt.getTime());
                                } else if (typeof review.watchedAt === 'string') {
                                  date = new Date(review.watchedAt);
                                } else {
                                  date = new Date(review.watchedAt as any);
                                }
                                
                                if (!isNaN(date.getTime())) {
                                  return date.toLocaleDateString('en-US', {
                                    month: 'short',
                                    year: 'numeric',
                                  });
                                }
                              } catch (error) {
                                console.error('Error formatting date:', error);
                              }
                              return 'Unknown date';
                            })()}
                          </span>
                        </div>
                        {review.body && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {review.body}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>

                  <div className="absolute top-2 right-2 z-10 flex gap-1.5 md:gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <WatchlistButton
                      movieId={movie.id}
                      variant="secondary"
                      size="icon"
                      className="rounded-full shadow-lg glass-card h-8 w-8 md:h-9 md:w-9"
                    />
                    <RatingButton
                      movieId={movie.id}
                      movieTitle={movie.title}
                      variant="secondary"
                      size="icon"
                      showBadge={false}
                      className="rounded-full shadow-lg glass-card h-8 w-8 md:h-9 md:w-9"
                      onSave={handleRefresh}
                    />
                    <Button
                      size="icon"
                      onClick={(e) => handleAddToCompare(e, movie)}
                      disabled={disabled || inComparison || isAdding}
                      variant={inComparison ? "default" : "secondary"}
                      className="rounded-full shadow-lg transition-smooth glass-card h-8 w-8 md:h-9 md:w-9 disabled:opacity-50"
                      title={inComparison ? 'Already in comparison' : disabled ? 'Maximum 4 movies allowed' : 'Add to comparison'}
                    >
                      {isAdding ? (
                        <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : inComparison ? (
                        <Check className="w-3 h-3 md:w-4 md:h-4" />
                      ) : (
                        <Scale className="w-3 h-3 md:w-4 md:h-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (confirm('Remove this movie from your watched history?')) {
                          handleDelete(review.id, review.movieId);
                        }
                      }}
                      disabled={removing === review.id}
                      className="rounded-full shadow-lg glass-card h-8 w-8 md:h-9 md:w-9"
                      title="Remove from watched history"
                    >
                      {removing === review.id ? (
                        <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


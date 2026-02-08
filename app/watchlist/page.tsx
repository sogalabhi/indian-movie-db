'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookmarkCheck, Star, Calendar, ArrowLeft, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';

interface WatchlistItem {
  id: string;
  userId: string;
  movieId: string;
  createdAt: any;
}

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
  overview?: string;
}

export default function WatchlistPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [movies, setMovies] = useState<Record<string, Movie>>({});
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch watchlist
  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!user || authLoading) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/watchlist');
        
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch watchlist');
        }

        const data = await response.json();
        setWatchlist(data.watchlist || []);

        // Fetch movie details for each watchlist item
        const moviePromises = data.watchlist.map(async (item: WatchlistItem) => {
          try {
            const movieResponse = await fetch(`/api/movies/${item.movieId}`);
            if (movieResponse.ok) {
              const movieData = await movieResponse.json();
              return { movieId: item.movieId, movie: movieData };
            }
          } catch (err) {
            console.error(`Error fetching movie ${item.movieId}:`, err);
          }
          return null;
        });

        const movieResults = await Promise.all(moviePromises);
        const moviesMap: Record<string, Movie> = {};
        movieResults.forEach((result) => {
          if (result) {
            moviesMap[result.movieId] = result.movie;
          }
        });
        setMovies(moviesMap);
      } catch (err: any) {
        console.error('Error fetching watchlist:', err);
        setError(err.message || 'Failed to load watchlist');
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, [user, authLoading, router]);

  const handleRemove = async (movieId: string) => {
    setRemoving(movieId);
    try {
      const response = await fetch(`/api/watchlist/${movieId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state
        setWatchlist((prev) => prev.filter((item) => item.movieId !== movieId));
        setMovies((prev) => {
          const updated = { ...prev };
          delete updated[movieId];
          return updated;
        });
      } else {
        const error = await response.json();
        console.error('Error removing from watchlist:', error);
      }
    } catch (err) {
      console.error('Error removing from watchlist:', err);
    } finally {
      setRemoving(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-8 md:h-10 w-48 md:w-64 mb-6 md:mb-8 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <Card key={i} className="overflow-hidden glass-card animate-pulse">
                <AspectRatio ratio={2 / 3}>
                  <Skeleton className="w-full h-full" />
                </AspectRatio>
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
                <BookmarkCheck className="w-6 h-6 md:w-8 md:h-8" />
                My Watchlist
              </h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                {watchlist.length} {watchlist.length === 1 ? 'movie' : 'movies'} saved
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mb-6 glass-card animate-fade-in">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {!loading && watchlist.length === 0 && (
          <div className="text-center py-12 md:py-20 animate-fade-in">
            <BookmarkCheck className="w-12 h-12 md:w-16 md:h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl md:text-2xl font-bold mb-2">Your watchlist is empty</h2>
            <p className="text-muted-foreground mb-6 text-sm md:text-base">
              Start adding movies to your watchlist to save them for later!
            </p>
            <Button asChild className="transition-smooth">
              <Link href="/">Browse Movies</Link>
            </Button>
          </div>
        )}

        {/* Watchlist Grid */}
        {watchlist.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {watchlist.map((item, index) => {
              const movie = movies[item.movieId];
              
              if (!movie) {
                return (
                  <Card key={item.id} className="overflow-hidden glass-card animate-pulse">
                    <AspectRatio ratio={2 / 3}>
                      <Skeleton className="w-full h-full" />
                    </AspectRatio>
                    <CardContent className="p-3 md:p-4">
                      <Skeleton className="h-4 w-full mb-2" />
                    </CardContent>
                  </Card>
                );
              }

              return (
                <div 
                  key={item.id} 
                  className="relative group animate-scale-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <Link href={`/movie/${movie.id}`} className="block h-full">
                    <Card className="glass-card hover-scale cursor-pointer h-full flex flex-col relative">
                      <div className="relative">
                        <AspectRatio ratio={2 / 3} className="overflow-hidden rounded-t-[calc(var(--radius)-2px)]">
                          <img
                            src={
                              movie.poster_path
                                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                                : 'https://via.placeholder.com/500x750?text=No+Image'
                            }
                            alt={movie.title}
                            className="w-full h-full object-cover transition-smooth"
                          />
                        </AspectRatio>
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
                        <div className="flex justify-between items-center text-xs md:text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 md:h-4 md:w-4 text-yellow-500 fill-current" />
                            {movie.vote_average?.toFixed(1)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                            {movie.release_date?.split('-')[0]}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                  
                  {/* Remove Button */}
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemove(item.movieId);
                    }}
                    disabled={removing === item.movieId}
                    className="absolute top-2 right-2 z-10 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-smooth glass-card h-8 w-8 md:h-9 md:w-9"
                    title="Remove from watchlist"
                  >
                    {removing === item.movieId ? (
                      <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Star, ArrowLeft, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import WatchlistButton from '@/app/components/WatchlistButton';
import RatingButton from '@/app/components/RatingButton';
import { useComparison } from '@/app/contexts/ComparisonContext';
import { Scale, Check } from 'lucide-react';

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
  imdbRating?: number;
  [key: string]: any;
}

export default function Imdb8PlusPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCompare, isInComparison, canAddMore } = useComparison();
  
  const [language, setLanguage] = useState(searchParams.get('language') || 'kn');
  const [showAllLanguages, setShowAllLanguages] = useState(searchParams.get('allLanguages') === 'true');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [addingMovieId, setAddingMovieId] = useState<number | null>(null);

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams({
          type: 'imdb8',
          language,
          allLanguages: showAllLanguages.toString(),
          page: page.toString(),
          limit: '20',
        });

        const response = await fetch(`/api/movies/high-rated?${params.toString()}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch movies');
        }

        const data = await response.json();
        setMovies(data.results || []);
        setTotalPages(data.total_pages || 1);
        setTotalResults(data.total_results || 0);
      } catch (err: any) {
        console.error('Error fetching IMDb 8+ movies:', err);
        setError(err.message || 'Failed to load movies');
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [language, showAllLanguages, page]);

  const handleAddToCompare = async (e: React.MouseEvent, movie: Movie) => {
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
                <Star className="w-6 h-6 md:w-8 md:h-8 text-yellow-500 fill-current" />
                IMDb 8+ Movies
              </h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                {totalResults} {totalResults === 1 ? 'movie' : 'movies'} found
              </p>
            </div>
          </div>
        </div>

        {/* Language Filter */}
        <div className="flex items-center gap-4 mb-6 md:mb-8 animate-fade-in">
          <Select value={language} onValueChange={setLanguage} disabled={showAllLanguages}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kn">Kannada</SelectItem>
              <SelectItem value="te">Telugu</SelectItem>
              <SelectItem value="ta">Tamil</SelectItem>
              <SelectItem value="hi">Hindi</SelectItem>
              <SelectItem value="ml">Malayalam</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={showAllLanguages ? "default" : "outline"}
            onClick={() => setShowAllLanguages(!showAllLanguages)}
            className="transition-smooth"
          >
            {showAllLanguages ? 'All Languages' : 'Specific Language'}
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive" className="mb-6 glass-card animate-fade-in">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {Array.from({ length: 20 }).map((_, i) => (
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
        ) : movies.length > 0 ? (
          <>
            {/* Movies Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 mb-6 md:mb-8">
              {movies.map((movie, index) => {
                const inComparison = isInComparison(movie.id);
                const isAdding = addingMovieId === movie.id;
                const disabled = !canAddMore && !inComparison;

                return (
                  <div 
                    key={movie.id} 
                    className="relative h-full animate-scale-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <Link href={`/movie/${movie.id}`} className="block h-full">
                      <Card className="glass-card overflow-hidden hover-scale cursor-pointer group h-full flex flex-col">
                        <div className="relative h-[210px] md:h-[270px] lg:h-[300px] w-full overflow-hidden">
                          <img
                            src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
                            alt={movie.title}
                            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
                            style={{ objectFit: 'cover', objectPosition: 'center' }}
                          />
                          {/* IMDb Rating Badge */}
                          {movie.imdbRating && (
                            <Badge className="absolute top-2 left-2 glass-card text-xs md:text-sm px-2 py-1 bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                              <Star className="w-3 h-3 md:w-4 md:h-4 fill-current mr-1" />
                              {movie.imdbRating.toFixed(1)}
                            </Badge>
                          )}
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

                    <div className="absolute top-2 right-2 z-10 flex gap-1.5 md:gap-2">
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
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 animate-fade-in">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="transition-smooth"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                  className="transition-smooth"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 md:py-20 animate-fade-in">
            <Star className="w-12 h-12 md:w-16 md:h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl md:text-2xl font-bold mb-2">No IMDb 8+ movies found</h2>
            <p className="text-muted-foreground mb-6 text-sm md:text-base">
              Try adjusting your language filter or check back later.
            </p>
            <Button asChild className="transition-smooth">
              <Link href="/">Browse All Movies</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Star, Film, Calendar, Newspaper, Scale, Check, AlertCircle, ChevronRight, LogIn, LogOut, User, BookmarkCheck } from 'lucide-react';
import { useComparison } from './contexts/ComparisonContext';
import { useAuth } from './contexts/AuthContext';
import WatchlistButton from './components/WatchlistButton';

// Shadcn UI Imports
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';

export default function Home() {
  const router = useRouter();
  const [language, setLanguage] = useState('kn');
  const { addToCompare, isInComparison, canAddMore } = useComparison();
  const { user, loading: authLoading, signOut } = useAuth();
  
  interface Movie {
    id: number;
    title: string;
    poster_path: string | null;
    vote_average: number;
    release_date: string;
    [key: string]: any;
  }

  const [movies, setMovies] = useState<Movie[]>([]);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingMovieId, setAddingMovieId] = useState<number | null>(null);

  // Genre sections
  const genres = [
    { id: 28, name: 'Action' },
    { id: 18, name: 'Drama' },
    { id: 35, name: 'Comedy' },
    { id: 53, name: 'Thriller' },
    { id: 10749, name: 'Romance' },
    { id: 878, name: 'Sci-Fi' },
  ];

  const [genreMovies, setGenreMovies] = useState<Record<number, { movies: Movie[]; loading: boolean; error: string | null }>>({});

  // Debounce Logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => clearTimeout(handler);
  }, [query]);

  // Fetch Movies
  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (debouncedQuery) {
          params.append('query', debouncedQuery);
        } else {
          params.append('language', language);
        }

        const response = await fetch(`/api/movies?${params.toString()}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch movies');
        }

        const data = await response.json();
        setMovies(data.results || []);
      } catch (error: any) {
        console.error("Error fetching data", error);
        setError(error.message || 'Failed to load movies. Please try again.');
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [language, debouncedQuery]);

  // Fetch Genre Movies (only when not searching)
  useEffect(() => {
    if (debouncedQuery) {
      // Clear genre movies when searching
      setGenreMovies({});
      return;
    }

    const fetchGenreMovies = async () => {
      // Initialize loading states
      const initialGenreMovies: Record<number, { movies: Movie[]; loading: boolean; error: string | null }> = {};
      genres.forEach((genre) => {
        initialGenreMovies[genre.id] = { movies: [], loading: true, error: null };
      });
      setGenreMovies(initialGenreMovies);

      // Fetch all genres in parallel
      const promises = genres.map(async (genre) => {
        try {
          const response = await fetch(`/api/movies/genre?genre_id=${genre.id}&language=${language}&page=1`);
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to fetch ${genre.name} movies`);
          }

          const data = await response.json();
          return {
            genreId: genre.id,
            movies: data.results || [],
            error: null,
          };
        } catch (error: any) {
          console.error(`Error fetching ${genre.name} movies:`, error);
          return {
            genreId: genre.id,
            movies: [],
            error: error.message || 'Failed to load movies',
          };
        }
      });

      const results = await Promise.all(promises);
      const updatedGenreMovies: Record<number, { movies: Movie[]; loading: boolean; error: string | null }> = {};

      results.forEach(({ genreId, movies, error }) => {
        updatedGenreMovies[genreId] = {
          movies,
          loading: false,
          error,
        };
      });

      setGenreMovies(updatedGenreMovies);
    };

    fetchGenreMovies();
  }, [language, debouncedQuery]);

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

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    // CHANGE 1: Use standard background and foreground colors
    <div className="min-h-screen bg-background text-foreground p-8">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-6">
          {/* CHANGE 2: Use `text-primary` instead of hardcoded red */}
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Film className="w-8 h-8" /> ABCD
          </h1>
          {/* CHANGE 3: Use `text-muted-foreground` and standard hover states */}
          <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
            <Link href="/news" className="flex items-center gap-2">
              <Newspaper className="w-5 h-5" />
              <span className="font-semibold">News</span>
            </Link>
          </Button>
          
          {/* Watchlist Link (if logged in) */}
          {user && (
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
              <Link href="/watchlist" className="flex items-center gap-2">
                <BookmarkCheck className="w-5 h-5" />
                <span className="font-semibold">Watchlist</span>
              </Link>
            </Button>
          )}
          
          {/* Auth Buttons */}
          {!authLoading && (
            
            <>
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{user.displayName || user.email?.split('@')[0] || 'User'}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={handleLogout}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    <span className="font-semibold">Logout</span>
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
                  <Link href="/login" className="flex items-center gap-2">
                    <LogIn className="w-5 h-5" />
                    <span className="font-semibold">Login</span>
                  </Link>
                </Button>
              )}
            </>
          )}
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          {/* Language Filter */}
          <Select value={language} onValueChange={setLanguage}>
            {/* CHANGE 4: Removed custom background colors (handled by component now) */}
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

          {/* Search Bar */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-3 text-muted-foreground h-5 w-5 z-10" />
            {/* CHANGE 5: Clean Input component */}
            <Input
              type="text"
              placeholder="Search movies..."
              className="pl-10"
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Genre Sections - Only show when not searching */}
      {!debouncedQuery && (
        <div className="space-y-8 mb-12">
          {genres.map((genre) => {
            const genreData = genreMovies[genre.id];
            const isLoading = genreData?.loading ?? true;
            const genreMoviesList = genreData?.movies ?? [];

            return (
              <div key={genre.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">{genre.name} Movies</h2>
                  {genreMoviesList.length > 0 && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/genre/${genre.id}?name=${genre.name}`} className="flex items-center gap-1">
                        View All <ChevronRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  )}
                </div>
                
                {isLoading ? (
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Card key={i} className="min-w-[140px] md:min-w-[180px] flex-shrink-0 overflow-hidden">
                        <AspectRatio ratio={2 / 3}>
                          <Skeleton className="w-full h-full" />
                        </AspectRatio>
                        <CardContent className="p-3">
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-3 w-2/3" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : genreData?.error ? (
                  <Alert variant="destructive">
                    <AlertDescription className="text-sm">{genreData.error}</AlertDescription>
                  </Alert>
                ) : genreMoviesList.length > 0 ? (
                  <div className="flex gap-4 overflow-x-auto pb-4 scroll-smooth scrollbar-hide" style={{ 
                    scrollSnapType: 'x mandatory'
                  } as React.CSSProperties}>
                    {genreMoviesList.map((movie) => {
                      const inComparison = isInComparison(movie.id);
                      const isAdding = addingMovieId === movie.id;
                      const disabled = !canAddMore && !inComparison;

                      return (
                        <div key={movie.id} className="relative min-w-[140px] md:min-w-[180px] flex-shrink-0" style={{ scrollSnapAlign: 'start' }}>
                          <Link href={`/movie/${movie.id}`} className="block h-full">
                            <Card className="overflow-hidden hover:scale-105 transition-transform duration-200 cursor-pointer shadow-lg group h-full flex flex-col">
                              <div className="relative">
                                <AspectRatio ratio={2 / 3}>
                                  <img
                                    src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
                                    alt={movie.title}
                                    className="w-full h-full object-cover"
                                  />
                                </AspectRatio>
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Badge variant="secondary" className="text-xs px-3 py-1">
                                    View Details
                                  </Badge>
                                </div>
                              </div>
                              <CardContent className="p-3 flex-grow flex flex-col justify-end">
                                <h3 className="font-bold text-sm md:text-base truncate mb-1" title={movie.title}>{movie.title}</h3>
                                <div className="flex justify-between items-center text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                    {movie.vote_average?.toFixed(1)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {movie.release_date?.split('-')[0]}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                          <Button
                            size="icon"
                            onClick={(e) => handleAddToCompare(e, movie)}
                            disabled={disabled || inComparison || isAdding}
                            variant={inComparison ? "default" : "secondary"}
                            className="absolute top-2 right-2 z-10 rounded-full shadow-lg transition-all h-7 w-7"
                            title={inComparison ? 'Already in comparison' : disabled ? 'Maximum 4 movies allowed' : 'Add to comparison'}
                          >
                            {isAdding ? (
                              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : inComparison ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Scale className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription className="text-sm text-muted-foreground">
                      No {genre.name.toLowerCase()} movies found.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Main Movies Grid Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-6">
          {debouncedQuery ? 'Search Results' : 'All Movies'}
        </h2>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} className="overflow-hidden h-full">
              <AspectRatio ratio={2 / 3}>
                <Skeleton className="w-full h-full" />
              </AspectRatio>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-1/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {movies.length > 0 ? (
            movies.map((movie) => {
              const inComparison = isInComparison(movie.id);
              const isAdding = addingMovieId === movie.id;
              const disabled = !canAddMore && !inComparison;

              return (
                <div key={movie.id} className="relative h-full">
                  <Link href={`/movie/${movie.id}`} className="block h-full">
                    {/* CHANGE 6: Card uses default border/bg colors from theme */}
                    <Card className="overflow-hidden hover:scale-105 transition-transform duration-200 cursor-pointer shadow-lg group h-full flex flex-col">
                      <div className="relative">
                        <AspectRatio ratio={2 / 3}>
                          <img
                            src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                          />
                        </AspectRatio>
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Badge variant="secondary" className="text-sm px-4 py-1">
                            View Details
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-4 flex-grow flex flex-col justify-end">
                        <h2 className="font-bold text-lg truncate mb-2" title={movie.title}>{movie.title}</h2>
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            {/* Note: Star color often kept explicit for UI, or use text-primary */}
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            {movie.vote_average?.toFixed(1)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {movie.release_date?.split('-')[0]}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  <div className="absolute top-2 right-2 z-10 flex gap-2">
                    <WatchlistButton
                      movieId={movie.id}
                      variant="secondary"
                      size="icon"
                      className="rounded-full shadow-lg"
                    />
                    {/* Compare Button */}
                    <Button
                      size="icon"
                      onClick={(e) => handleAddToCompare(e, movie)}
                      disabled={disabled || inComparison || isAdding}
                      // CHANGE 7: Use variants for logic instead of manual classes
                      variant={inComparison ? "default" : "secondary"}
                      className={`
                        rounded-full shadow-lg transition-all
                        ${disabled ? 'opacity-50' : 'hover:scale-110 active:scale-95'}
                      `}
                      title={inComparison ? 'Already in comparison' : disabled ? 'Maximum 4 movies allowed' : 'Add to comparison'}
                    >
                      {isAdding ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : inComparison ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Scale className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full mt-10">
               <Alert className="text-center">
                 <AlertDescription className="text-muted-foreground">
                    No movies found matching your criteria.
                 </AlertDescription>
               </Alert>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
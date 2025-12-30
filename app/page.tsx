'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Star, Film, Calendar, Newspaper, Scale, Check, AlertCircle, ChevronRight, LogIn, LogOut, User, BookmarkCheck } from 'lucide-react';
import { useComparison } from './contexts/ComparisonContext';
import { useAuth } from './contexts/AuthContext';
import WatchlistButton from './components/WatchlistButton';
import { ThemeToggle } from './components/ThemeToggle';

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
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 pb-20 md:pb-8">
      
      {/* Header & Controls */}
      <div className="space-y-4 mb-6 md:mb-8 animate-fade-in">
        {/* First Row: Logo, Navigation, Login, Theme Toggle */}
        <div className="flex flex-row justify-between items-center gap-4">
          {/* Left: Logo and Desktop Navigation */}
          <div className="flex items-center gap-3 md:gap-6 flex-shrink-0">
            <h1 className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-2 whitespace-nowrap">
              <Film className="w-6 h-6 md:w-8 md:h-8" /> ABCD
            </h1>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground transition-smooth">
                <Link href="/news" className="flex items-center gap-2">
                  <Newspaper className="w-5 h-5" />
                  <span className="font-semibold">News</span>
                </Link>
              </Button>
              
              {user && (
                <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground transition-smooth">
                  <Link href="/watchlist" className="flex items-center gap-2">
                    <BookmarkCheck className="w-5 h-5" />
                    <span className="font-semibold">Watchlist</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>
          
          {/* Right: Auth & Theme Toggle */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {!authLoading && (
              <>
                {user ? (
                  <div className="hidden md:flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span className="font-medium">{user.displayName || user.email?.split('@')[0] || 'User'}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      onClick={handleLogout}
                      className="text-muted-foreground hover:text-foreground transition-smooth"
                    >
                      <LogOut className="w-5 h-5 mr-2" />
                      <span className="font-semibold">Logout</span>
                    </Button>
                  </div>
                ) : (
                  <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground transition-smooth whitespace-nowrap">
                    <Link href="/login" className="flex items-center gap-1.5 md:gap-2">
                      <LogIn className="w-4 h-4 md:w-5 md:h-5" />
                      <span className="font-semibold text-sm md:text-base">Login</span>
                    </Link>
                  </Button>
                )}
              </>
            )}
            <ThemeToggle />
          </div>
        </div>

        {/* Second Row: Language Filter and Search */}
        <div className="flex gap-3 md:gap-4 w-full">
          {/* Language Filter */}
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-full md:w-[180px]">
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5 z-10" />
            <Input
              type="text"
              placeholder="Search movies..."
              className="pl-10 transition-smooth"
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
              <div key={genre.id} className="space-y-3 md:space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">{genre.name} Movies</h2>
                  {genreMoviesList.length > 0 && (
                    <Button variant="ghost" size="sm" asChild className="transition-smooth">
                      <Link href={`/genre/${genre.id}?name=${genre.name}`} className="flex items-center gap-1">
                        View All <ChevronRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  )}
                </div>
                
                {isLoading ? (
                  <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Card key={i} className="min-w-[140px] md:min-w-[180px] flex-shrink-0 overflow-hidden glass-card animate-pulse">
                        <div className="h-[210px] md:h-[270px]">
                          <Skeleton className="w-full h-full" />
                        </div>
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
                  <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 scroll-smooth scrollbar-hide" style={{ 
                    scrollSnapType: 'x mandatory'
                  } as React.CSSProperties}>
                    {genreMoviesList.map((movie, index) => {
                      const inComparison = isInComparison(movie.id);
                      const isAdding = addingMovieId === movie.id;
                      const disabled = !canAddMore && !inComparison;

                      return (
                        <div 
                          key={movie.id} 
                          className="relative min-w-[140px] md:min-w-[180px] flex-shrink-0 animate-slide-up" 
                          style={{ 
                            scrollSnapAlign: 'start',
                            animationDelay: `${index * 50}ms`
                          }}
                        >
                          <Link href={`/movie/${movie.id}`} className="block h-full">
                            <Card className="glass-card overflow-hidden hover-scale cursor-pointer group h-full flex flex-col">
                              <div className="relative h-[210px] md:h-[270px] w-full overflow-hidden">
                                <img
                                  src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
                                  alt={movie.title}
                                  className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
                                  style={{ objectFit: 'cover', objectPosition: 'center' }}
                                />
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <Badge variant="secondary" className="text-xs px-3 py-1 glass-card">
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
                            className="absolute top-2 right-2 z-10 rounded-full shadow-lg transition-smooth h-8 w-8 md:h-9 md:w-9 glass-card"
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
      <div className="mb-6 md:mb-8 animate-fade-in">
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">
          {debouncedQuery ? 'Search Results' : 'All Movies'}
        </h2>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} className="overflow-hidden h-full glass-card animate-pulse">
              <div className="h-[210px] md:h-[270px] lg:h-[300px]">
                <Skeleton className="w-full h-full" />
              </div>
              <CardContent className="p-3 md:p-4 space-y-2">
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {movies.length > 0 ? (
            movies.map((movie, index) => {
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
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Badge variant="secondary" className="text-xs md:text-sm px-3 md:px-4 py-1 glass-card">
                            View Details
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-3 md:p-4 flex-grow flex flex-col justify-end">
                        <h2 className="font-bold text-sm md:text-lg truncate mb-2" title={movie.title}>{movie.title}</h2>
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
            })
          ) : (
            <div className="col-span-full mt-10 animate-fade-in">
               <Alert className="text-center glass-card">
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
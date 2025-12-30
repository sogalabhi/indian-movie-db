'use client';

import { useRouter } from 'next/navigation';
import { useComparison } from '../contexts/ComparisonContext';
import { ArrowLeft, X, Star, Calendar, Clock, DollarSign, Film, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { fetchMultipleImdbAwards } from '@/lib/movie-utils';

// Shadcn UI Imports
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Separator } from '@/components/ui/separator';

export default function ComparePage() {
  const router = useRouter();
  const { movies, removeFromCompare, clearCompare } = useComparison();
  const [loadingDetails, setLoadingDetails] = useState<Record<number, boolean>>({});
  const [fullMovieDetails, setFullMovieDetails] = useState<Record<number, any>>({});
  const [omdbData, setOmdbData] = useState<Record<number, any>>({});
  const [loadingOmdb, setLoadingOmdb] = useState<Record<number, boolean>>({});
  const [awardsData, setAwardsData] = useState<Record<number, any[]>>({});
  const [loadingAwards, setLoadingAwards] = useState<Record<number, boolean>>({});

  // --- Data Fetching Logic (Kept Same) ---
  useEffect(() => {
    const fetchMissingDetails = async () => {
      const moviesToFetch = movies.filter((movie) => !movie.runtime || !movie.genres || movie.genres.length === 0);
      if (moviesToFetch.length === 0) return;

      setLoadingDetails((prev) => {
        const newState = { ...prev };
        moviesToFetch.forEach((m) => { newState[m.id] = true; });
        return newState;
      });

      try {
        const promises = moviesToFetch.map((movie) => axios.get(`/api/movies/${movie.id}?append_to_response=external_ids`));
        const responses = await Promise.all(promises);
        const detailsMap: Record<number, any> = {};
        responses.forEach((response, index) => {
          const movie = moviesToFetch[index];
          detailsMap[movie.id] = response.data;
        });
        setFullMovieDetails((prev) => ({ ...prev, ...detailsMap }));
      } catch (error) {
        console.error('Error fetching movie details:', error);
      } finally {
        setLoadingDetails((prev) => {
          const newState = { ...prev };
          moviesToFetch.forEach((m) => { newState[m.id] = false; });
          return newState;
        });
      }
    };
    fetchMissingDetails();
  }, [movies]);

  useEffect(() => {
    const fetchOmdbData = async () => {
      const moviesToFetch = movies.filter((movie) => !omdbData[movie.id]);
      if (moviesToFetch.length === 0) return;

      const moviesNeedingIds = moviesToFetch.filter((m) => {
        const details = fullMovieDetails[m.id] || m;
        return !details.external_ids?.imdb_id;
      });

      if (moviesNeedingIds.length > 0) {
        try {
          const idPromises = moviesNeedingIds.map((movie) => axios.get(`/api/movies/${movie.id}?append_to_response=external_ids`));
          const idResponses = await Promise.all(idPromises);
          idResponses.forEach((response, index) => {
            const movie = moviesNeedingIds[index];
            setFullMovieDetails((prev) => ({ ...prev, [movie.id]: { ...prev[movie.id], ...response.data }, }));
          });
        } catch (error) { console.error('Error fetching external IDs:', error); }
      }

      const moviesWithImdbId = moviesToFetch.map((movie) => {
        const details = fullMovieDetails[movie.id] || movie;
        return { movie, imdbId: details.external_ids?.imdb_id, };
      }).filter(({ imdbId }) => imdbId);

      if (moviesWithImdbId.length === 0) return;

      setLoadingOmdb((prev) => {
        const newState = { ...prev };
        moviesWithImdbId.forEach(({ movie }) => { newState[movie.id] = true; });
        return newState;
      });

      try {
        const omdbPromises = moviesWithImdbId.map(async ({ movie, imdbId }, index) => {
          if (index > 0) await new Promise((resolve) => setTimeout(resolve, index * 200));
          return axios.get(`/api/omdb?imdbId=${imdbId}`, { timeout: 10000 })
            .then((response) => ({ movieId: movie.id, data: response.data }))
            .catch((error) => ({ movieId: movie.id, data: null }));
        });

        const omdbResponses = await Promise.all(omdbPromises);
        const omdbMap: Record<number, any> = {};
        omdbResponses.forEach(({ movieId, data }) => { if (data) omdbMap[movieId] = data; });
        setOmdbData((prev) => ({ ...prev, ...omdbMap }));
      } catch (error) { console.error('Error fetching OMDB data:', error); } finally {
        setLoadingOmdb((prev) => {
          const newState = { ...prev };
          moviesWithImdbId.forEach(({ movie }) => { newState[movie.id] = false; });
          return newState;
        });
      }
    };
    fetchOmdbData();
  }, [movies, fullMovieDetails, omdbData]);

  // Fetch Awards Data
  useEffect(() => {
    const fetchAwards = async () => {
      const moviesToFetch = movies.filter((movie) => {
        const omdb = omdbData[movie.id];
        return omdb?.imdbID && !awardsData[movie.id] && !loadingAwards[movie.id];
      });

      if (moviesToFetch.length === 0) return;

      setLoadingAwards((prev) => {
        const newState = { ...prev };
        moviesToFetch.forEach((m) => { newState[m.id] = true; });
        return newState;
      });

      try {
        const moviesWithImdbId = moviesToFetch
          .map((movie) => {
            const omdb = omdbData[movie.id];
            return omdb?.imdbID ? { movieId: movie.id, imdbId: omdb.imdbID } : null;
          })
          .filter((item): item is { movieId: number; imdbId: string } => item !== null);

        if (moviesWithImdbId.length > 0) {
          const awardsMap = await fetchMultipleImdbAwards(moviesWithImdbId);
          setAwardsData((prev) => ({ ...prev, ...awardsMap }));
        }
      } catch (error) {
        console.error('Error fetching awards:', error);
      } finally {
        setLoadingAwards((prev) => {
          const newState = { ...prev };
          moviesToFetch.forEach((m) => { newState[m.id] = false; });
          return newState;
        });
      }
    };

    fetchAwards();
  }, [movies, omdbData, awardsData, loadingAwards]);

  // --- Helpers ---
  const getMovieData = (movie: any) => {
    const fullDetails = fullMovieDetails[movie.id];
    return {
      ...movie,
      runtime: fullDetails?.runtime || movie.runtime || 0,
      genres: fullDetails?.genres || movie.genres || [],
      budget: fullDetails?.budget || movie.budget || 0,
      revenue: fullDetails?.revenue || movie.revenue || 0,
      overview: fullDetails?.overview || movie.overview || '',
    };
  };

  const formatCurrency = (amount: number) => {
    if (!amount || amount === 0) return 'N/A';
    return `$${(amount / 1000000).toFixed(1)}M`;
  };

  const formatRuntime = (minutes: number) => {
    if (!minutes || minutes === 0) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (movies.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => router.back()} className="mb-6 md:mb-8 pl-0 hover:bg-transparent transition-smooth animate-fade-in">
            <ArrowLeft className="w-5 h-5 mr-2" /> Back
          </Button>

          <Card className="glass-card p-8 md:p-12 text-center animate-scale-in">
            <CardContent className="flex flex-col items-center">
              <div className="bg-muted p-4 md:p-6 rounded-full mb-4 md:mb-6">
                 <Film className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-2">No Movies to Compare</h2>
              <p className="text-muted-foreground mb-6 text-sm md:text-base">
                Add up to 4 movies from the homepage or movie detail pages to start comparing.
              </p>
              <Button asChild className="transition-smooth">
                <Link href="/">Browse Movies</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 pb-20 md:pb-8">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4 animate-fade-in">
          <div className="flex items-center gap-3 md:gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()} className="transition-smooth hover-scale">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-primary">Movie Comparison</h1>
                <p className="text-xs md:text-sm text-muted-foreground">Comparing {movies.length} of 4 movies</p>
            </div>
          </div>
          {movies.length > 0 && (
            <Button variant="destructive" onClick={clearCompare} size="sm" className="transition-smooth">
              Clear All
            </Button>
          )}
        </div>

        {/* Comparison Table - Desktop (Shadcn Table) */}
        <div className="hidden md:block animate-fade-in">
          <div className="rounded-md border glass-card">
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px] bg-muted/50 align-middle">Property</TableHead>
                  
                  {movies.map((movie) => (
                    <TableHead key={movie.id} className="w-[21.5%] text-center align-top p-4 relative">
                        <div className="group relative">
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => removeFromCompare(movie.id)}
                                className="absolute -top-1 -right-1 h-6 w-6 text-muted-foreground hover:text-destructive z-10 opacity-0 group-hover:opacity-100 transition-smooth"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                            <div className="w-2/3 mx-auto mb-3 rounded-md overflow-hidden shadow-sm glass-card">
                                <AspectRatio ratio={2/3}>
                                    {movie.poster_path ? (
                                        <img
                                            src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                                            alt={movie.title}
                                            className="object-cover w-full h-full transition-smooth"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-muted flex items-center justify-center">
                                            <Film className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                    )}
                                </AspectRatio>
                            </div>
                            <Button variant="link" asChild className="p-0 h-auto font-bold text-base whitespace-normal text-center leading-tight transition-smooth">
                                <Link href={`/movie/${movie.id}`}>{movie.title}</Link>
                            </Button>
                        </div>
                    </TableHead>
                  ))}
                  
                  {/* Empty columns - fill remaining space */}
                  {Array.from({ length: 4 - movies.length }).map((_, index) => (
                    <TableHead key={`empty-${index}`} className="w-[21.5%] text-center align-middle bg-muted/20">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground opacity-50 scale-90">
                         <div className="w-16 h-24 border-2 border-dashed border-muted-foreground/50 rounded-lg flex items-center justify-center">
                            <Film className="w-6 h-6" />
                         </div>
                         <span className="text-xs">Add Movie</span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* TMDB Rating */}
                <TableRow>
                  <TableCell className="font-medium bg-muted/50">
                    <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" /> TMDB
                    </div>
                  </TableCell>
                  {movies.map((movie) => (
                    <TableCell key={movie.id} className="text-center font-semibold">
                       {movie.vote_average?.toFixed(1)}/10
                    </TableCell>
                  ))}
                  {Array.from({ length: 4 - movies.length }).map((_, i) => <TableCell key={i} className="text-center bg-muted/20">-</TableCell>)}
                </TableRow>

                {/* IMDb Rating */}
                <TableRow>
                  <TableCell className="font-medium bg-muted/50">
                    <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" /> IMDb
                    </div>
                  </TableCell>
                  {movies.map((movie) => {
                    const omdb = omdbData[movie.id];
                    const isLoading = loadingOmdb[movie.id];
                    return (
                      <TableCell key={movie.id} className="text-center">
                         {isLoading ? "..." : omdb?.imdbRating && omdb.imdbRating !== 'N/A' ? `${omdb.imdbRating}/10` : 'N/A'}
                      </TableCell>
                    );
                  })}
                  {Array.from({ length: 4 - movies.length }).map((_, i) => <TableCell key={i} className="text-center bg-muted/20">-</TableCell>)}
                </TableRow>

                {/* Rotten Tomatoes */}
                <TableRow>
                   <TableCell className="font-medium bg-muted/50">
                    <div className="flex items-center gap-2">
                        <span className="text-destructive font-bold text-xs border border-destructive px-1 rounded">RT</span> Rotten Tomatoes
                    </div>
                  </TableCell>
                  {movies.map((movie) => {
                    const omdb = omdbData[movie.id];
                    const isLoading = loadingOmdb[movie.id];
                    const rtRating = omdb?.Ratings?.find((r: any) => r.Source === 'Rotten Tomatoes')?.Value;
                    return (
                      <TableCell key={movie.id} className="text-center text-destructive font-semibold">
                         {isLoading ? "..." : rtRating || 'N/A'}
                      </TableCell>
                    );
                  })}
                  {Array.from({ length: 4 - movies.length }).map((_, i) => <TableCell key={i} className="text-center bg-muted/20">-</TableCell>)}
                </TableRow>

                {/* Release Date */}
                <TableRow>
                  <TableCell className="font-medium bg-muted/50">
                     <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Release</div>
                  </TableCell>
                  {movies.map((movie) => (
                    <TableCell key={movie.id} className="text-center text-sm">
                      {movie.release_date ? new Date(movie.release_date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                  ))}
                   {Array.from({ length: 4 - movies.length }).map((_, i) => <TableCell key={i} className="text-center bg-muted/20">-</TableCell>)}
                </TableRow>

                {/* Runtime */}
                <TableRow>
                  <TableCell className="font-medium bg-muted/50">
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> Runtime</div>
                  </TableCell>
                  {movies.map((movie) => (
                    <TableCell key={movie.id} className="text-center">{formatRuntime(getMovieData(movie).runtime)}</TableCell>
                  ))}
                   {Array.from({ length: 4 - movies.length }).map((_, i) => <TableCell key={i} className="text-center bg-muted/20">-</TableCell>)}
                </TableRow>

                 {/* Genres */}
                 <TableRow>
                  <TableCell className="font-medium bg-muted/50">Genres</TableCell>
                  {movies.map((movie) => {
                    const data = getMovieData(movie);
                    return (
                      <TableCell key={movie.id} className="text-center">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {data.genres && data.genres.length > 0 ? (
                            data.genres.slice(0, 2).map((genre: any) => (
                              <Badge key={genre.id || genre} variant="secondary" className="text-[10px] px-1 py-0 h-5">
                                {genre.name || genre}
                              </Badge>
                            ))
                          ) : '-'}
                        </div>
                      </TableCell>
                    );
                  })}
                   {Array.from({ length: 4 - movies.length }).map((_, i) => <TableCell key={i} className="text-center bg-muted/20">-</TableCell>)}
                </TableRow>

                {/* Budget */}
                <TableRow>
                  <TableCell className="font-medium bg-muted/50">
                    <div className="flex items-center gap-2"><DollarSign className="w-4 h-4" /> Budget</div>
                  </TableCell>
                  {movies.map((movie) => (
                    <TableCell key={movie.id} className="text-center text-sm">{formatCurrency(getMovieData(movie).budget)}</TableCell>
                  ))}
                   {Array.from({ length: 4 - movies.length }).map((_, i) => <TableCell key={i} className="text-center bg-muted/20">-</TableCell>)}
                </TableRow>

                {/* Revenue */}
                <TableRow>
                  <TableCell className="font-medium bg-muted/50">
                    <div className="flex items-center gap-2"><DollarSign className="w-4 h-4" /> Revenue</div>
                  </TableCell>
                  {movies.map((movie) => (
                    <TableCell key={movie.id} className="text-center text-sm">{formatCurrency(getMovieData(movie).revenue)}</TableCell>
                  ))}
                   {Array.from({ length: 4 - movies.length }).map((_, i) => <TableCell key={i} className="text-center bg-muted/20">-</TableCell>)}
                </TableRow>

                {/* Overview */}
                <TableRow>
                  <TableCell className="font-medium bg-muted/50">Overview</TableCell>
                  {movies.map((movie) => (
                    <TableCell key={movie.id} className="text-xs text-muted-foreground p-2">
                        <p className="whitespace-normal leading-relaxed">{getMovieData(movie).overview || 'N/A'}</p>
                    </TableCell>
                  ))}
                   {Array.from({ length: 4 - movies.length }).map((_, i) => <TableCell key={i} className="text-center bg-muted/20">-</TableCell>)}
                </TableRow>

                {/* Awards */}
                <TableRow>
                  <TableCell className="font-medium bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-primary" /> Awards
                    </div>
                  </TableCell>
                  {movies.map((movie) => {
                    const omdb = omdbData[movie.id];
                    const awards = awardsData[movie.id] || [];
                    const isLoading = loadingAwards[movie.id];
                    const hasAwards = awards.length > 0;
                    
                    return (
                      <TableCell key={movie.id} className="p-2">
                        {isLoading ? (
                          <span className="text-xs text-muted-foreground">Loading...</span>
                        ) : hasAwards ? (
                          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
                            {awards.slice(0, 5).map((award: any, index: number) => {
                              if (award.award) {
                                const isWin = award.status?.toLowerCase().includes('win') || award.status?.toLowerCase().includes('won');
                                return (
                                  <div key={index} className="text-xs border rounded p-2 glass-card transition-smooth hover:scale-[1.02]">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <p className="font-semibold truncate" title={award.award}>{award.award}</p>
                                        {award.category && (
                                          <p className="text-muted-foreground truncate text-[10px]" title={award.category}>{award.category}</p>
                                        )}
                                        {award.recipient && (
                                          <p className="text-muted-foreground/70 truncate text-[10px]">{award.recipient}</p>
                                        )}
                                      </div>
                                      <Badge variant={isWin ? "default" : "secondary"} className="text-[10px] px-1 py-0 h-4 flex-shrink-0">
                                        {award.status || 'Winner'}
                                      </Badge>
                                    </div>
                                  </div>
                                );
                              }
                              return (
                                <div key={index} className="text-xs text-muted-foreground p-2 border rounded glass-card">
                                  {award.raw || award}
                                </div>
                              );
                            })}
                            {awards.length > 5 && (
                              <p className="text-xs text-muted-foreground italic">+{awards.length - 5} more awards</p>
                            )}
                          </div>
                        ) : omdb?.Awards && omdb.Awards !== 'N/A' ? (
                          <p className="text-xs text-muted-foreground">{omdb.Awards}</p>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                    );
                  })}
                  {Array.from({ length: 4 - movies.length }).map((_, i) => <TableCell key={i} className="text-center bg-muted/20">-</TableCell>)}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Mobile View - Stacked Cards */}
        <div className="md:hidden space-y-4">
          {movies.map((movie, index) => {
            const data = getMovieData(movie);
            return (
              <Card 
                key={movie.id} 
                className="glass-card overflow-hidden animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start">
                   <div className="w-28 h-40 md:w-32 md:h-48 flex-shrink-0">
                    <AspectRatio ratio={2/3}>
                      {movie.poster_path ? (
                          <img
                          src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                          alt={movie.title}
                          className="w-full h-full object-cover transition-smooth"
                          />
                      ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Film className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
                          </div>
                      )}
                    </AspectRatio>
                   </div>
                   <div className="flex-1 p-3 md:p-4">
                      <div className="flex justify-between items-start">
                         <h3 className="font-bold text-base md:text-lg leading-tight mb-2">
                             <Link href={`/movie/${movie.id}`} className="hover:underline transition-smooth">{movie.title}</Link>
                         </h3>
                         <Button size="icon" variant="ghost" className="h-6 w-6 transition-smooth hover-scale" onClick={() => removeFromCompare(movie.id)}>
                             <X className="w-4 h-4" />
                         </Button>
                      </div>
                      
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center gap-1 text-xs md:text-sm">
                           <Star className="w-3 h-3 text-yellow-500 fill-current" />
                           <span className="font-semibold">{movie.vote_average?.toFixed(1)}</span>
                           <span className="text-muted-foreground text-[10px] md:text-xs">(TMDB)</span>
                        </div>
                        {omdbData[movie.id]?.imdbRating && (
                            <div className="flex items-center gap-1 text-xs md:text-sm">
                                <span className="font-bold bg-yellow-500 text-black px-1 rounded text-[10px]">IMDb</span>
                                <span>{omdbData[movie.id].imdbRating}</span>
                            </div>
                        )}
                      </div>
                   </div>
                </div>
                <CardContent className="p-3 md:p-4 space-y-3 text-xs md:text-sm">
                  <div>
                    <span className="text-muted-foreground block mb-1">Overview</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">{data.overview || 'N/A'}</p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-muted-foreground">Release Date</div>
                    <div className="text-right">{movie.release_date ? new Date(movie.release_date).toLocaleDateString() : 'N/A'}</div>
                    <div className="text-muted-foreground">Runtime</div>
                    <div className="text-right">{formatRuntime(data.runtime)}</div>
                  </div>
                  <Separator />
                  <div>
                    <span className="text-muted-foreground block mb-1">Genres</span>
                    <div className="flex flex-wrap gap-1">
                      {data.genres?.slice(0, 3).map((genre: any) => (
                        <Badge key={genre.id || genre} variant="outline" className="text-[10px] md:text-xs">
                          {genre.name || genre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {(awardsData[movie.id]?.length > 0 || omdbData[movie.id]?.Awards) && (
                    <>
                      <Separator />
                      <div>
                        <span className="text-muted-foreground block mb-1 flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-primary" /> Awards
                        </span>
                        {awardsData[movie.id]?.length > 0 ? (
                          <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-hide">
                            {awardsData[movie.id].slice(0, 3).map((award: any, awardIndex: number) => {
                              if (award.award) {
                                return (
                                  <div key={awardIndex} className="text-xs border rounded p-1.5 glass-card transition-smooth">
                                    <p className="font-semibold truncate">{award.award}</p>
                                    {award.category && <p className="text-muted-foreground text-[10px] truncate">{award.category}</p>}
                                  </div>
                                );
                              }
                              return null;
                            })}
                            {awardsData[movie.id].length > 3 && (
                              <p className="text-xs text-muted-foreground italic">+{awardsData[movie.id].length - 3} more</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {omdbData[movie.id]?.Awards && omdbData[movie.id].Awards !== 'N/A' 
                              ? omdbData[movie.id].Awards 
                              : 'N/A'}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
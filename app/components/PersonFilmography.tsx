'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Calendar, Filter } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface MovieCredit {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  character?: string; // For acting roles
  job?: string; // For crew roles (Director, Writer, etc.)
  department?: string;
}

interface PersonFilmographyProps {
  movieCredits: {
    cast?: MovieCredit[];
    crew?: MovieCredit[];
  };
  className?: string;
}

export default function PersonFilmography({
  movieCredits,
  className = '',
}: PersonFilmographyProps) {
  const [filter, setFilter] = useState<'all' | 'director' | 'actor' | 'writer'>('all');

  console.log('🎬 PersonFilmography: Component mounted');
  console.log(`📊 PersonFilmography: Processing ${(movieCredits.cast?.length || 0) + (movieCredits.crew?.length || 0)} credits`);

  // Process and combine credits
  const allMovies = useMemo(() => {
    const movies: Record<number, MovieCredit & { roles: string[] }> = {};

    // Process cast (acting roles)
    if (movieCredits.cast) {
      movieCredits.cast.forEach((credit) => {
        if (!movies[credit.id]) {
          movies[credit.id] = {
            ...credit,
            roles: [],
          };
        }
        movies[credit.id].roles.push('Actor');
      });
    }

    // Process crew (directing, writing, etc.)
    if (movieCredits.crew) {
      movieCredits.crew.forEach((credit) => {
        if (!movies[credit.id]) {
          movies[credit.id] = {
            ...credit,
            roles: [],
          };
        }
        // Add the job/department as a role
        if (credit.job) {
          movies[credit.id].roles.push(credit.job);
        } else if (credit.department) {
          movies[credit.id].roles.push(credit.department);
        }
      });
    }

    // Convert to array and sort by release date (newest first)
    const moviesArray = Object.values(movies).sort((a, b) => {
      const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
      const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
      return dateB - dateA;
    });

    return moviesArray;
  }, [movieCredits]);

  // Count by role type
  const roleCounts = useMemo(() => {
    const counts = {
      director: 0,
      actor: 0,
      writer: 0,
      other: 0,
    };

    allMovies.forEach((movie) => {
      movie.roles.forEach((role) => {
        const roleLower = role.toLowerCase();
        if (roleLower.includes('director')) {
          counts.director++;
        } else if (roleLower.includes('actor') || roleLower.includes('cast')) {
          counts.actor++;
        } else if (roleLower.includes('writer') || roleLower.includes('screenplay')) {
          counts.writer++;
        } else {
          counts.other++;
        }
      });
    });

    return counts;
  }, [allMovies]);

  // Filter movies based on selected filter
  const filteredMovies = useMemo(() => {
    if (filter === 'all') {
      return allMovies;
    }

    return allMovies.filter((movie) => {
      return movie.roles.some((role) => {
        const roleLower = role.toLowerCase();
        if (filter === 'director') {
          return roleLower.includes('director');
        } else if (filter === 'actor') {
          return roleLower.includes('actor') || roleLower.includes('cast');
        } else if (filter === 'writer') {
          return roleLower.includes('writer') || roleLower.includes('screenplay');
        }
        return false;
      });
    });
  }, [allMovies, filter]);

  console.log(`🎭 PersonFilmography: Roles - Director: ${roleCounts.director}, Actor: ${roleCounts.actor}, Writer: ${roleCounts.writer}, Other: ${roleCounts.other}`);
  console.log(`🎨 PersonFilmography: Rendering ${filteredMovies.length} movie cards (filter: ${filter})`);

  if (allMovies.length === 0) {
    return (
      <div className={className}>
        <p className="text-muted-foreground text-center py-8">No filmography available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filter:</span>
        </div>
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className="text-xs"
        >
          All ({allMovies.length})
        </Button>
        {roleCounts.director > 0 && (
          <Button
            variant={filter === 'director' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('director')}
            className="text-xs"
          >
            Director ({roleCounts.director})
          </Button>
        )}
        {roleCounts.actor > 0 && (
          <Button
            variant={filter === 'actor' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('actor')}
            className="text-xs"
          >
            Actor ({roleCounts.actor})
          </Button>
        )}
        {roleCounts.writer > 0 && (
          <Button
            variant={filter === 'writer' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('writer')}
            className="text-xs"
          >
            Writer ({roleCounts.writer})
          </Button>
        )}
      </div>

      {/* Movie Grid */}
      {filteredMovies.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No movies found for this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredMovies.map((movie) => (
          <Link key={movie.id} href={`/movie/${movie.id}`}>
            <Card className="cursor-pointer glass-card hover:shadow-lg transition-all duration-200 overflow-hidden group h-full">
              <CardContent className="p-0">
                <AspectRatio ratio={2 / 3} className="relative bg-muted">
                  {movie.poster_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 150px, 200px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                      <span className="text-4xl">🎬</span>
                    </div>
                  )}
                </AspectRatio>
                <div className="p-3 md:p-4">
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2" title={movie.title}>
                    {movie.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      {movie.vote_average?.toFixed(1) || 'N/A'}
                    </span>
                    {movie.release_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(movie.release_date).getFullYear()}
                      </span>
                    )}
                  </div>
                  {movie.roles.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {movie.roles.slice(0, 2).map((role, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {role}
                        </Badge>
                      ))}
                      {movie.roles.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{movie.roles.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
          ))}
        </div>
      )}
    </div>
  );
}


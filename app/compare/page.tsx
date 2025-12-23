'use client';

import { useRouter } from 'next/navigation';
import { useComparison } from '../contexts/ComparisonContext';
import { ArrowLeft, X, Star, Calendar, Clock, DollarSign, Film } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function ComparePage() {
  const router = useRouter();
  const { movies, removeFromCompare, clearCompare } = useComparison();
  const [loadingDetails, setLoadingDetails] = useState<Record<number, boolean>>({});
  const [fullMovieDetails, setFullMovieDetails] = useState<Record<number, any>>({});

  // Fetch full details for movies that might be missing data
  useEffect(() => {
    const fetchMissingDetails = async () => {
      const moviesToFetch = movies.filter((movie) => {
        // Check if movie has all required fields
        return !movie.runtime || !movie.genres || movie.genres.length === 0;
      });

      if (moviesToFetch.length === 0) return;

      const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
      if (!TMDB_API_KEY) return;

      setLoadingDetails((prev) => {
        const newState = { ...prev };
        moviesToFetch.forEach((m) => {
          newState[m.id] = true;
        });
        return newState;
      });

      try {
        const promises = moviesToFetch.map((movie) =>
          axios.get(`https://api.themoviedb.org/3/movie/${movie.id}`, {
            params: { api_key: TMDB_API_KEY },
          })
        );

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
          moviesToFetch.forEach((m) => {
            newState[m.id] = false;
          });
          return newState;
        });
      }
    };

    fetchMissingDetails();
  }, [movies]);

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

  const truncateText = (text: string, maxLength: number = 150) => {
    if (!text) return 'N/A';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (movies.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
            <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-300 mb-2">No Movies to Compare</h2>
            <p className="text-gray-500 mb-6">
              Add up to 4 movies from the homepage or movie detail pages to start comparing.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              Browse Movies
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-red-500">Movie Comparison</h1>
            <span className="text-gray-400">({movies.length} of 4)</span>
          </div>
          {movies.length > 0 && (
            <button
              onClick={clearCompare}
              className="text-gray-400 hover:text-red-500 transition-colors text-sm"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Comparison Table - Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="p-4 text-left text-gray-400 font-semibold">Property</th>
                  {movies.map((movie, index) => (
                    <th key={movie.id} className="p-4 text-center relative min-w-[200px]">
                      <button
                        onClick={() => removeFromCompare(movie.id)}
                        className="absolute top-2 right-2 text-gray-500 hover:text-red-500 transition-colors"
                        aria-label="Remove from comparison"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="flex flex-col items-center gap-2">
                        {movie.poster_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                            alt={movie.title}
                            className="w-24 h-36 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-24 h-36 bg-gray-700 rounded-lg flex items-center justify-center">
                            <Film className="w-8 h-8 text-gray-600" />
                          </div>
                        )}
                        <Link
                          href={`/movie/${movie.id}`}
                          className="font-bold text-lg hover:text-red-500 transition-colors line-clamp-2"
                        >
                          {movie.title}
                        </Link>
                      </div>
                    </th>
                  ))}
                  {/* Empty columns for remaining slots */}
                  {Array.from({ length: 4 - movies.length }).map((_, index) => (
                    <th key={`empty-${index}`} className="p-4 text-center min-w-[200px]">
                      <div className="flex flex-col items-center gap-2 text-gray-600">
                        <div className="w-24 h-36 bg-gray-700/50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600">
                          <Film className="w-8 h-8" />
                        </div>
                        <span className="text-sm">Add Movie</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Rating */}
                <tr className="border-b border-gray-700/50">
                  <td className="p-4 font-semibold text-gray-300 flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    Rating
                  </td>
                  {movies.map((movie) => (
                    <td key={movie.id} className="p-4 text-center">
                      <span className="flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        {movie.vote_average?.toFixed(1)}/10
                      </span>
                    </td>
                  ))}
                  {Array.from({ length: 4 - movies.length }).map((_, index) => (
                    <td key={`empty-rating-${index}`} className="p-4 text-center text-gray-600">
                      -
                    </td>
                  ))}
                </tr>

                {/* Release Date */}
                <tr className="border-b border-gray-700/50">
                  <td className="p-4 font-semibold text-gray-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-red-500" />
                    Release Date
                  </td>
                  {movies.map((movie) => (
                    <td key={movie.id} className="p-4 text-center">
                      {movie.release_date
                        ? new Date(movie.release_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'N/A'}
                    </td>
                  ))}
                  {Array.from({ length: 4 - movies.length }).map((_, index) => (
                    <td key={`empty-date-${index}`} className="p-4 text-center text-gray-600">
                      -
                    </td>
                  ))}
                </tr>

                {/* Runtime */}
                <tr className="border-b border-gray-700/50">
                  <td className="p-4 font-semibold text-gray-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    Runtime
                  </td>
                  {movies.map((movie) => {
                    const data = getMovieData(movie);
                    return (
                      <td key={movie.id} className="p-4 text-center">
                        {formatRuntime(data.runtime)}
                      </td>
                    );
                  })}
                  {Array.from({ length: 4 - movies.length }).map((_, index) => (
                    <td key={`empty-runtime-${index}`} className="p-4 text-center text-gray-600">
                      -
                    </td>
                  ))}
                </tr>

                {/* Genres */}
                <tr className="border-b border-gray-700/50">
                  <td className="p-4 font-semibold text-gray-300">Genres</td>
                  {movies.map((movie) => {
                    const data = getMovieData(movie);
                    return (
                      <td key={movie.id} className="p-4 text-center">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {data.genres && data.genres.length > 0 ? (
                            data.genres.slice(0, 3).map((genre: any) => (
                              <span
                                key={genre.id || genre}
                                className="bg-gray-700 text-xs px-2 py-1 rounded"
                              >
                                {genre.name || genre}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500">N/A</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  {Array.from({ length: 4 - movies.length }).map((_, index) => (
                    <td key={`empty-genres-${index}`} className="p-4 text-center text-gray-600">
                      -
                    </td>
                  ))}
                </tr>

                {/* Budget */}
                <tr className="border-b border-gray-700/50">
                  <td className="p-4 font-semibold text-gray-300 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    Budget
                  </td>
                  {movies.map((movie) => {
                    const data = getMovieData(movie);
                    return (
                      <td key={movie.id} className="p-4 text-center">
                        {formatCurrency(data.budget)}
                      </td>
                    );
                  })}
                  {Array.from({ length: 4 - movies.length }).map((_, index) => (
                    <td key={`empty-budget-${index}`} className="p-4 text-center text-gray-600">
                      -
                    </td>
                  ))}
                </tr>

                {/* Revenue */}
                <tr className="border-b border-gray-700/50">
                  <td className="p-4 font-semibold text-gray-300 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    Revenue
                  </td>
                  {movies.map((movie) => {
                    const data = getMovieData(movie);
                    return (
                      <td key={movie.id} className="p-4 text-center">
                        {formatCurrency(data.revenue)}
                      </td>
                    );
                  })}
                  {Array.from({ length: 4 - movies.length }).map((_, index) => (
                    <td key={`empty-revenue-${index}`} className="p-4 text-center text-gray-600">
                      -
                    </td>
                  ))}
                </tr>

                {/* Overview */}
                <tr>
                  <td className="p-4 font-semibold text-gray-300">Overview</td>
                  {movies.map((movie) => {
                    const data = getMovieData(movie);
                    return (
                      <td key={movie.id} className="p-4 text-center text-sm text-gray-400">
                        {truncateText(data.overview)}
                      </td>
                    );
                  })}
                  {Array.from({ length: 4 - movies.length }).map((_, index) => (
                    <td key={`empty-overview-${index}`} className="p-4 text-center text-gray-600">
                      -
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile View - Stacked Cards */}
        <div className="md:hidden space-y-6">
          {movies.map((movie) => {
            const data = getMovieData(movie);
            return (
              <div
                key={movie.id}
                className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
              >
                <div className="p-4 flex items-start justify-between border-b border-gray-700">
                  <div className="flex items-center gap-3 flex-1">
                    {movie.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w150${movie.poster_path}`}
                        alt={movie.title}
                        className="w-16 h-24 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-24 bg-gray-700 rounded-lg flex items-center justify-center">
                        <Film className="w-6 h-6 text-gray-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      <Link
                        href={`/movie/${movie.id}`}
                        className="font-bold text-lg hover:text-red-500 transition-colors block"
                      >
                        {movie.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-400">
                          {movie.vote_average?.toFixed(1)}/10
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCompare(movie.id)}
                    className="text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Release Date:</span>
                    <span className="text-white">
                      {movie.release_date
                        ? new Date(movie.release_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Runtime:</span>
                    <span className="text-white">{formatRuntime(data.runtime)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Genres:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {data.genres && data.genres.length > 0 ? (
                        data.genres.slice(0, 3).map((genre: any) => (
                          <span
                            key={genre.id || genre}
                            className="bg-gray-700 text-xs px-2 py-1 rounded"
                          >
                            {genre.name || genre}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Budget:</span>
                    <span className="text-white">{formatCurrency(data.budget)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Revenue:</span>
                    <span className="text-white">{formatCurrency(data.revenue)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Overview:</span>
                    <p className="text-white mt-1">{truncateText(data.overview, 200)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


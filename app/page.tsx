'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Search, Star, Film, Calendar, Newspaper, Scale, Check } from 'lucide-react';
import { useComparison } from './contexts/ComparisonContext';

export default function Home() {
  // Removed duplicate useState for movies
  const [language, setLanguage] = useState('kn');
  const { addToCompare, isInComparison, canAddMore } = useComparison();
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
  const [debouncedQuery, setDebouncedQuery] = useState(''); // New state for debounce
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingMovieId, setAddingMovieId] = useState<number | null>(null);

  // Debounce Logic: Prevents API calls on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500); // Wait 500ms after user stops typing

    return () => {
      clearTimeout(handler);
    };
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
  }, [language, debouncedQuery]); // Only runs when language or the *debounced* query changes

  const handleAddToCompare = async (e: React.MouseEvent, movie: Movie) => {
    e.preventDefault();
    e.stopPropagation();

    if (!canAddMore || isInComparison(movie.id)) {
      return;
    }

    setAddingMovieId(movie.id);

    try {
      // Fetch full movie details via API route
      const response = await fetch(`/api/movies/${movie.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch movie details');
      }
      
      const fullMovie = await response.json();

      // Convert to ComparisonMovie format
      const comparisonMovie = {
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
      };

      addToCompare(comparisonMovie);
    } catch (error) {
      console.error('Error fetching movie details:', error);
    } finally {
      setAddingMovieId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-6">
          <h1 className="text-3xl font-bold text-red-500 flex items-center gap-2">
            <Film className="w-8 h-8" /> ABCD
          </h1>
          <Link
            href="/news"
            className="flex items-center gap-2 text-gray-300 hover:text-red-500 transition-colors"
          >
            <Newspaper className="w-5 h-5" />
            <span className="font-semibold">News</span>
          </Link>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          {/* Language Filter */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-gray-800 border border-gray-700 p-3 rounded-lg focus:outline-none focus:border-red-500 text-white"
          >
            <option value="kn">Kannada</option>
            <option value="te">Telugu</option>
            <option value="ta">Tamil</option>
            <option value="hi">Hindi</option>
            <option value="ml">Malayalam</option>
          </select>

          {/* Search Bar */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-3.5 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search movies..."
              className="w-full bg-gray-800 border border-gray-700 p-3 pl-10 rounded-lg focus:outline-none focus:border-red-500 text-white"
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 mb-6 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Movie Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {movies.length > 0 ? (
            movies.map((movie) => {
              const inComparison = isInComparison(movie.id);
              const isAdding = addingMovieId === movie.id;
              const disabled = !canAddMore && !inComparison;

              return (
                <div key={movie.id} className="relative">
                  <Link href={`/movie/${movie.id}`}>
                    <div className="bg-gray-800 rounded-xl overflow-hidden hover:scale-105 transition-transform duration-200 cursor-pointer shadow-lg group h-full">
                    {/* Poster */}
                    <div className="relative aspect-[2/3]">
                      <img
                        src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="bg-red-600 text-white px-4 py-2 rounded-full font-semibold text-sm">View Full Details</span>
                      </div>
                    </div>

                    {/* Basic Info */}
                    <div className="p-4">
                      <h2 className="font-bold text-lg truncate" title={movie.title}>{movie.title}</h2>
                      <div className="flex justify-between items-center text-sm text-gray-400 mt-2">
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          {movie.vote_average?.toFixed(1)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {movie.release_date?.split('-')[0]}
                        </span>
                      </div>
                    </div>
                    </div>
                  </Link>

                  {/* Compare Button */}
                  <button
                    onClick={(e) => handleAddToCompare(e, movie)}
                    disabled={disabled || inComparison || isAdding}
                    className={`
                      absolute top-2 right-2 z-10
                      ${inComparison 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : disabled 
                        ? 'bg-gray-600 cursor-not-allowed opacity-50' 
                        : 'bg-red-600 hover:bg-red-700'
                      }
                      text-white
                      p-2
                      rounded-full
                      shadow-lg
                      transition-all
                      hover:scale-110
                      active:scale-95
                      disabled:cursor-not-allowed
                      group/btn
                    `}
                    title={
                      inComparison 
                        ? 'Already in comparison' 
                        : disabled 
                        ? 'Maximum 4 movies allowed' 
                        : 'Add to comparison'
                    }
                  >
                    {isAdding ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : inComparison ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Scale className="w-4 h-4" />
                    )}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center text-gray-500 mt-10">
              No movies found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
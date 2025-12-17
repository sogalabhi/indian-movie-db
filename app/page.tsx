'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Search, Star, Film, Calendar } from 'lucide-react';

export default function Home() {
  // Removed duplicate useState for movies
  const [language, setLanguage] = useState('kn');
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
  // TMDB Configuration
  const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

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
      if (!API_KEY) {
        console.error("API Key is missing!");
        return;
      }

      setLoading(true);
      try {
        const endpoint = debouncedQuery
          ? `${TMDB_BASE_URL}/search/movie`
          : `${TMDB_BASE_URL}/discover/movie`;

        const params: any = {
          api_key: API_KEY,
          region: 'IN',
          sort_by: 'popularity.desc',
          include_adult: false,
        };

        if (debouncedQuery) {
          params.query = debouncedQuery;
        } else {
          params.with_original_language = language;
        }

        const response = await axios.get(endpoint, { params });
        setMovies(response.data.results || []);
      } catch (error) {
        console.error("Error fetching data", error);
      }
      setLoading(false);
    };

    fetchMovies();
  }, [language, debouncedQuery, API_KEY]); // Only runs when language or the *debounced* query changes

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-red-500 flex items-center gap-2">
          <Film className="w-8 h-8" /> Indian CineDB
        </h1>

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

      {/* Movie Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {movies.length > 0 ? (
            movies.map((movie) => (
              <Link href={`/movie/${movie.id}`} key={movie.id}>
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
            ))
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
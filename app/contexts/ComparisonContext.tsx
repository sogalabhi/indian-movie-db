'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface ComparisonMovie {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
  overview: string;
  runtime: number;
  genres: { id: number; name: string }[];
  budget: number;
  revenue: number;
  backdrop_path: string | null;
}

interface ComparisonContextType {
  movies: ComparisonMovie[];
  addToCompare: (movie: ComparisonMovie) => void;
  removeFromCompare: (movieId: number) => void;
  clearCompare: () => void;
  isInComparison: (movieId: number) => boolean;
  canAddMore: boolean;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

const STORAGE_KEY = 'movie-comparison';
const MAX_COMPARISON_MOVIES = 4;

export function ComparisonProvider({ children }: { children: React.ReactNode }) {
  const [movies, setMovies] = useState<ComparisonMovie[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setMovies(parsed);
      }
    } catch (error) {
      console.error('Error loading comparison from localStorage:', error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Save to localStorage whenever movies change
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(movies));
      } catch (error) {
        console.error('Error saving comparison to localStorage:', error);
      }
    }
  }, [movies, isHydrated]);

  const addToCompare = useCallback((movie: ComparisonMovie) => {
    setMovies((prev) => {
      // Check if already in comparison
      if (prev.some((m) => m.id === movie.id)) {
        return prev;
      }
      // Check if max limit reached
      if (prev.length >= MAX_COMPARISON_MOVIES) {
        return prev;
      }
      return [...prev, movie];
    });
  }, []);

  const removeFromCompare = useCallback((movieId: number) => {
    setMovies((prev) => prev.filter((m) => m.id !== movieId));
  }, []);

  const clearCompare = useCallback(() => {
    setMovies([]);
  }, []);

  const isInComparison = useCallback(
    (movieId: number) => {
      return movies.some((m) => m.id === movieId);
    },
    [movies]
  );

  const canAddMore = movies.length < MAX_COMPARISON_MOVIES;

  return (
    <ComparisonContext.Provider
      value={{
        movies,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInComparison,
        canAddMore,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (context === undefined) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
}


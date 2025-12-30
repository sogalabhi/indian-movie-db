import { NextResponse } from 'next/server';
import axios from 'axios';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const OMDB_BASE_URL = 'https://www.omdbapi.com/';

// In-memory cache with TTL
const cache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface MovieWithRating {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
  imdbRating?: number;
  rtRating?: number;
  [key: string]: any;
}

// Helper to extract RT percentage from rating string
function extractRTPercentage(rtValue: string): number | null {
  if (!rtValue) return null;
  const match = rtValue.match(/(\d+)%/);
  return match ? parseInt(match[1], 10) : null;
}

// Batch fetch OMDb ratings
async function fetchOmdbRatings(imdbIds: string[]): Promise<Record<string, any>> {
  const OMDB_API_KEY = process.env.NEXT_PUBLIC_OMDB_API_KEY;
  if (!OMDB_API_KEY) {
    console.warn('OMDB API key not configured');
    return {};
  }

  const results: Record<string, any> = {};
  const BATCH_SIZE = 5; // Limit concurrent requests

  // Process in batches to avoid rate limiting
  for (let i = 0; i < imdbIds.length; i += BATCH_SIZE) {
    const batch = imdbIds.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (imdbId) => {
      try {
        const response = await axios.get(OMDB_BASE_URL, {
          params: {
            apikey: OMDB_API_KEY,
            i: imdbId,
          },
          timeout: 5000,
        });

        if (response.data.Response === 'True') {
          return { imdbId, data: response.data };
        }
        return null;
      } catch (error) {
        console.warn(`Failed to fetch OMDb data for ${imdbId}:`, error);
        return null;
      }
    });

    const batchResults = await Promise.allSettled(promises);
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        results[result.value.imdbId] = result.value.data;
      }
    });

    // Small delay between batches to be respectful to API
    if (i + BATCH_SIZE < imdbIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return results;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'imdb8' or 'rt80'
  const language = searchParams.get('language') || 'kn';
  const allLanguages = searchParams.get('allLanguages') === 'true';
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const page = parseInt(searchParams.get('page') || '1', 10);

  const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const OMDB_API_KEY = process.env.NEXT_PUBLIC_OMDB_API_KEY;

  if (!TMDB_API_KEY) {
    return NextResponse.json(
      { error: 'TMDB API key is not configured' },
      { status: 500 }
    );
  }

  if (!OMDB_API_KEY) {
    return NextResponse.json(
      { error: 'OMDB API key is not configured' },
      { status: 500 }
    );
  }

  if (!type || (type !== 'imdb8' && type !== 'rt80')) {
    return NextResponse.json(
      { error: 'Invalid type. Must be "imdb8" or "rt80"' },
      { status: 400 }
    );
  }

  // Check cache
  const cacheKey = `${type}_${language}_${allLanguages}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return NextResponse.json({
      results: cached.data.slice(startIndex, endIndex),
      total_results: cached.data.length,
      total_pages: Math.ceil(cached.data.length / limit),
      page,
    });
  }

  try {
    // Fetch movies from TMDB
    const tmdbParams: any = {
      api_key: TMDB_API_KEY,
      region: 'IN',
      sort_by: 'popularity.desc',
      include_adult: false,
      page: 1,
    };

    if (!allLanguages) {
      tmdbParams.with_original_language = language;
    }

    // Fetch multiple pages to get enough movies (up to 5 pages = ~100 movies)
    const allMovies: any[] = [];
    const maxPages = 5;
    
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const response = await axios.get(`${TMDB_BASE_URL}/discover/movie`, {
        params: { ...tmdbParams, page: pageNum },
        timeout: 10000,
      });

      if (response.data.results) {
        allMovies.push(...response.data.results);
      }

      // Stop if we've fetched all available pages
      if (pageNum >= response.data.total_pages) {
        break;
      }
    }

    // Get IMDb IDs for all movies
    const moviesWithImdbIds: Array<{ movie: any; imdbId: string }> = [];
    
    // Fetch external_ids in batches
    const BATCH_SIZE = 10;
    for (let i = 0; i < allMovies.length; i += BATCH_SIZE) {
      const batch = allMovies.slice(i, i + BATCH_SIZE);
      const promises = batch.map(async (movie) => {
        try {
          const response = await axios.get(`${TMDB_BASE_URL}/movie/${movie.id}`, {
            params: {
              api_key: TMDB_API_KEY,
              append_to_response: 'external_ids',
            },
            timeout: 5000,
          });

          const imdbId = response.data.external_ids?.imdb_id;
          if (imdbId) {
            return { movie, imdbId };
          }
          return null;
        } catch (error) {
          console.warn(`Failed to fetch external_ids for movie ${movie.id}:`, error);
          return null;
        }
      });

      const results = await Promise.allSettled(promises);
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          moviesWithImdbIds.push(result.value);
        }
      });

      // Small delay between batches
      if (i + BATCH_SIZE < allMovies.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Fetch OMDb ratings
    const imdbIds = moviesWithImdbIds.map((item) => item.imdbId);
    const omdbData = await fetchOmdbRatings(imdbIds);

    // Filter movies based on rating threshold
    const filteredMovies: MovieWithRating[] = [];

    for (const { movie, imdbId } of moviesWithImdbIds) {
      const omdb = omdbData[imdbId];
      if (!omdb) continue;

      let passesFilter = false;
      let imdbRating: number | undefined;
      let rtRating: number | undefined;

      if (type === 'imdb8') {
        const rating = parseFloat(omdb.imdbRating);
        if (!isNaN(rating) && rating >= 8.0) {
          passesFilter = true;
          imdbRating = rating;
        }
      } else if (type === 'rt80') {
        const rtRatingObj = omdb.Ratings?.find((r: any) => r.Source === 'Rotten Tomatoes');
        if (rtRatingObj) {
          const rtPercent = extractRTPercentage(rtRatingObj.Value);
          if (rtPercent !== null && rtPercent >= 80) {
            passesFilter = true;
            rtRating = rtPercent;
          }
        }
      }

      if (passesFilter) {
        filteredMovies.push({
          ...movie,
          imdbRating,
          rtRating,
        });
      }
    }

    // Sort by rating (descending)
    filteredMovies.sort((a, b) => {
      if (type === 'imdb8') {
        return (b.imdbRating || 0) - (a.imdbRating || 0);
      } else {
        return (b.rtRating || 0) - (a.rtRating || 0);
      }
    });

    // Cache results
    cache.set(cacheKey, {
      data: filteredMovies,
      timestamp: Date.now(),
    });

    // Return paginated results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return NextResponse.json({
      results: filteredMovies.slice(startIndex, endIndex),
      total_results: filteredMovies.length,
      total_pages: Math.ceil(filteredMovies.length / limit),
      page,
    });
  } catch (error: any) {
    console.error('Error fetching high-rated movies:', error);

    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      return NextResponse.json(
        { error: 'Request timeout. Please try again.' },
        { status: 504 }
      );
    }

    const errorMessage = error.response?.data?.status_message || error.message || 'Failed to fetch movies';
    const statusCode = error.response?.status || 500;

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}


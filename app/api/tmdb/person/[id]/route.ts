import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * GET /api/tmdb/person/[id]
 * Fetch person data from TMDB API (LIVE data)
 * CRITICAL: Only used by detail page, NOT list view
 * 
 * Endpoint: /person/{id}?append_to_response=movie_credits,images
 * Cache: Next.js revalidation (1 hour)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

    console.log(`🎬 GET /api/tmdb/person/${id} - Fetching from TMDB...`);

    if (!API_KEY) {
      console.error('❌ GET /api/tmdb/person/[id] - TMDB API key not configured');
      return NextResponse.json(
        { error: 'TMDB API key is not configured' },
        { status: 500 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Person ID is required' },
        { status: 400 }
      );
    }

    console.log(`📡 TMDB API call initiated for person ID: ${id}`);

    const response = await axios.get(`${TMDB_BASE_URL}/person/${id}`, {
      params: {
        api_key: API_KEY,
        append_to_response: 'movie_credits,images',
      },
      timeout: 10000, // 10 second timeout
    });

    console.log(`✅ TMDB response received (status: ${response.status})`);

    const movieCredits = response.data.movie_credits || {};
    const movieCount = (movieCredits.cast || []).length + (movieCredits.crew || []).length;
    console.log(`📊 Filmography: ${movieCount} movies found`);

    console.log('📤 Returning person data');

    // Return with Next.js revalidation (1 hour cache)
    return NextResponse.json(response.data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error: any) {
    console.error(`❌ GET /api/tmdb/person/[id] - Error:`, error.message);

    // Handle timeout errors
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      console.error('❌ TMDB API request timed out');
      return NextResponse.json(
        { error: 'TMDB API request timed out. Please try again later.' },
        { status: 504 }
      );
    }

    // Handle network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ENETUNREACH') {
      return NextResponse.json(
        { error: 'Unable to connect to TMDB API. Please check your internet connection.' },
        { status: 503 }
      );
    }

    // Handle 404 errors
    if (error.response?.status === 404) {
      return NextResponse.json(
        { error: 'Person not found in TMDB' },
        { status: 404 }
      );
    }

    const errorMessage = error.response?.data?.status_message || error.message || 'Failed to fetch person data';
    const statusCode = error.response?.status || 500;

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}


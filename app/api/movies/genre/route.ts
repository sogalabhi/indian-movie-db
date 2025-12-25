import { NextResponse } from 'next/server';
import axios from 'axios';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const genreId = searchParams.get('genre_id');
  const language = searchParams.get('language') || 'kn';
  const page = searchParams.get('page') || '1';
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  if (!API_KEY) {
    return NextResponse.json(
      { error: 'TMDB API key is not configured' },
      { status: 500 }
    );
  }

  if (!genreId) {
    return NextResponse.json(
      { error: 'Genre ID is required' },
      { status: 400 }
    );
  }

  try {
    const response = await axios.get(`${TMDB_BASE_URL}/discover/movie`, {
      params: {
        api_key: API_KEY,
        with_genres: genreId,
        with_original_language: language,
        region: 'IN',
        sort_by: 'popularity.desc',
        include_adult: false,
        page: page,
      },
      timeout: 10000,
    });

    return NextResponse.json({
      results: response.data.results || [],
      total_pages: response.data.total_pages || 1,
      total_results: response.data.total_results || 0,
    });
  } catch (error: any) {
    console.error('Error fetching genre movies from TMDB:', error);
    
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


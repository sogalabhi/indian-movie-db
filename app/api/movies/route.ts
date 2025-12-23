import { NextResponse } from 'next/server';
import axios from 'axios';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const language = searchParams.get('language') || 'kn';
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  if (!API_KEY) {
    return NextResponse.json(
      { error: 'TMDB API key is not configured' },
      { status: 500 }
    );
  }

  try {
    const endpoint = query
      ? `${TMDB_BASE_URL}/search/movie`
      : `${TMDB_BASE_URL}/discover/movie`;

    const params: any = {
      api_key: API_KEY,
      region: 'IN',
      sort_by: 'popularity.desc',
      include_adult: false,
    };

    if (query) {
      params.query = query;
    } else {
      params.with_original_language = language;
    }

    const response = await axios.get(endpoint, { params });

    return NextResponse.json({
      results: response.data.results || [],
    });
  } catch (error: any) {
    console.error('Error fetching movies from TMDB:', error);
    
    // Provide more detailed error information
    const errorMessage = error.response?.data?.status_message || error.message || 'Failed to fetch movies';
    const statusCode = error.response?.status || 500;

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}



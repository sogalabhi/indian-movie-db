import { NextResponse } from 'next/server';
import axios from 'axios';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const appendToResponse = searchParams.get('append_to_response') || '';
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  console.log('Movie detail API called with ID:', id);
  console.log('Append to response:', appendToResponse);
  console.log('API key exists:', !!API_KEY);

  if (!API_KEY) {
    console.error('TMDB API key is not configured');
    return NextResponse.json(
      { error: 'TMDB API key is not configured' },
      { status: 500 }
    );
  }

  if (!id) {
    return NextResponse.json(
      { error: 'Movie ID is required' },
      { status: 400 }
    );
  }

  try {
    const requestParams: any = {
      api_key: API_KEY,
    };

    if (appendToResponse) {
      requestParams.append_to_response = appendToResponse;
    }

    console.log('Calling TMDB API for movie:', id);
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${id}`, {
      params: requestParams,
       timeout: 8000, // 8 second timeout
    });
    console.log('TMDB API response received, status:', response.status);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching movie details from TMDB:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Handle timeout errors
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      console.error('TMDB API request timed out');
      return NextResponse.json(
        { error: 'TMDB API request timed out. The service may be slow or unavailable. Please try again later.' },
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
    
    const errorMessage = error.response?.data?.status_message || error.message || 'Failed to fetch movie details';
    const statusCode = error.response?.status || 500;

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}


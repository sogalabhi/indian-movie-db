import { NextResponse } from 'next/server';
import axios from 'axios';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  if (!API_KEY) {
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
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${id}`, {
      params: {
        api_key: API_KEY,
      },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching movie details from TMDB:', error);
    
    const errorMessage = error.response?.data?.status_message || error.message || 'Failed to fetch movie details';
    const statusCode = error.response?.status || 500;

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}


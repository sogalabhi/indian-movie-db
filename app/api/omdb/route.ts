import { NextResponse } from 'next/server';
import axios from 'axios';

const OMDB_BASE_URL = 'https://www.omdbapi.com/';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imdbId = searchParams.get('imdbId');
  const plot = searchParams.get('plot') || 'short';
  const API_KEY = process.env.NEXT_PUBLIC_OMDB_API_KEY;

  if (!API_KEY) {
    return NextResponse.json(
      { error: 'OMDB API key is not configured' },
      { status: 500 }
    );
  }

  if (!imdbId) {
    return NextResponse.json(
      { error: 'IMDB ID is required' },
      { status: 400 }
    );
  }

  try {
    const response = await axios.get(OMDB_BASE_URL, {
      params: {
        apikey: API_KEY,
        i: imdbId,
        plot: plot,
      },
    });

    if (response.data.Response === 'False') {
      return NextResponse.json(
        { error: response.data.Error || 'Movie not found in OMDB' },
        { status: 404 }
      );
    }

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching movie details from OMDB:', error);
    
    const errorMessage = error.response?.data?.Error || error.message || 'Failed to fetch movie details';
    const statusCode = error.response?.status || 500;

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}


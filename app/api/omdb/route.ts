import { NextResponse } from 'next/server';
import axios from 'axios';

const OMDB_BASE_URL = 'https://www.omdbapi.com/';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imdbId = searchParams.get('imdbId');
  const plot = searchParams.get('plot') || 'short';
  const API_KEY = process.env.NEXT_PUBLIC_OMDB_API_KEY?.trim();

  if (!API_KEY) {
    return NextResponse.json(
      { error: 'OMDB API key is not configured. Please set NEXT_PUBLIC_OMDB_API_KEY in your .env.local file' },
      { status: 500 }
    );
  }

  // Basic validation - OMDb API keys are typically at least 8 characters
  if (API_KEY.length < 8) {
    console.warn('OMDb API key appears to be too short. Please verify it is complete.');
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

    // Check if OMDb returned an error response
    if (response.data.Response === 'False') {
      const omdbError = response.data.Error || 'Movie not found in OMDB';
      
      // Handle specific OMDb error messages
      if (omdbError.includes('Invalid API key') || omdbError.includes('401')) {
        return NextResponse.json(
          { 
            error: 'Invalid OMDb API key. Please check your NEXT_PUBLIC_OMDB_API_KEY in .env.local',
            details: omdbError
          },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: omdbError },
        { status: 404 }
      );
    }

    return NextResponse.json(response.data);
  } catch (error: any) {
    // Handle 401 Unauthorized specifically - return graceful error
    if (error.response?.status === 401) {
      // Log in development only
      if (process.env.NODE_ENV === 'development') {
        console.warn('OMDb API key issue - returning graceful error');
      }
      
      // Return a simple error object that won't cause client-side issues
      return NextResponse.json(
        { 
          error: 'Could not fetch ratings data',
          unavailable: true
        },
        { status: 200 } // Return 200 so client doesn't treat it as an error
      );
    }
    
    // For other errors, also return gracefully
    if (process.env.NODE_ENV === 'development') {
      console.warn('OMDb API error:', error.response?.status || error.message);
    }
    
    return NextResponse.json(
      { 
        error: 'Could not fetch ratings data',
        unavailable: true
      },
      { status: 200 } // Return 200 so client doesn't treat it as an error
    );
  }
}


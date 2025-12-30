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
    // Log detailed error information for debugging
    console.error('Error fetching movie details from OMDB:');
    console.error('Status:', error.response?.status);
    console.error('Error data:', error.response?.data);
    console.error('Error message:', error.message);
    console.error('API Key length:', API_KEY?.length);
    console.error('API Key first 4 chars:', API_KEY?.substring(0, 4));
    
    // Handle 401 Unauthorized specifically
    if (error.response?.status === 401) {
      const omdbErrorMsg = error.response?.data?.Error || error.response?.data?.error || 'Unauthorized access to OMDb API';
      console.error('OMDb API Error:', omdbErrorMsg);
      
      return NextResponse.json(
        { 
          error: 'OMDb API key is invalid or expired. Please check your NEXT_PUBLIC_OMDB_API_KEY in .env.local',
          details: omdbErrorMsg,
          hint: 'Get a free API key at https://www.omdbapi.com/apikey.aspx'
        },
        { status: 401 }
      );
    }
    
    const errorMessage = error.response?.data?.Error || error.response?.data?.error || error.message || 'Failed to fetch movie details';
    const statusCode = error.response?.status || 500;

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}


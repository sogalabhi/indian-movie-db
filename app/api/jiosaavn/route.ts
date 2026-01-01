import { NextRequest, NextResponse } from 'next/server';

const JIOSAAVN_API_BASE = 'https://jiosaavn-green.vercel.app';

/**
 * GET /api/jiosaavn
 * Search for songs on JioSaavn by query
 * 
 * Query params:
 * - query: Search query (e.g., movie title)
 * - limit: Number of results to return (default: 10)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const limit = searchParams.get('limit') || '10';

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    console.log(`🎵 Fetching songs from JioSaavn for query: ${query}`);

    // Try different endpoint structures (with correct /api prefix)
    const endpoints = [
      `/api/search/songs?query=${encodeURIComponent(query)}&page=0&limit=${limit}`,
      `/api/search?query=${encodeURIComponent(query)}&limit=${limit}`,
    ];
    
    let response: Response | null = null;
    
    // Try each endpoint until one works
    for (const endpoint of endpoints) {
      try {
        // Create new AbortController for each attempt
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const searchUrl = `${JIOSAAVN_API_BASE}${endpoint}`;
        console.log(`🔍 Trying endpoint: ${searchUrl}`);
        
        try {
          response = await fetch(searchUrl, {
            headers: {
              'Accept': 'application/json',
            },
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);

          if (response.ok) {
            console.log(`✅ Success with endpoint: ${endpoint}`);
            break;
          } else if (response.status === 404) {
            console.log(`⚠️ 404 with endpoint: ${endpoint}, trying next...`);
            clearTimeout(timeoutId);
            continue;
          } else {
            clearTimeout(timeoutId);
            throw new Error(`JioSaavn API returned ${response.status}`);
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            // Timeout - return empty results
            console.log(`⏱️ Request timed out`);
            return NextResponse.json({ 
              songs: [],
              total: 0,
              error: 'Request timed out'
            }, { status: 200 });
          }
          throw fetchError;
        }
      } catch (fetchError: any) {
        console.log(`⚠️ Error with endpoint ${endpoint}:`, fetchError.message);
        // Continue to next endpoint
        continue;
      }
    }
    
    if (!response || !response.ok) {
      // If all endpoints failed, return empty results gracefully
      console.log(`⚠️ All endpoints failed, returning empty results`);
      return NextResponse.json({ 
        songs: [],
        total: 0,
        error: 'No songs found or API unavailable'
      }, { status: 200 });
    }
    
    try {
      const data = await response.json();
      
      console.log('📦 JioSaavn API response structure:', {
        success: data.success,
        hasData: !!data.data,
        hasResults: !!data.data?.results,
        isArray: Array.isArray(data),
        keys: Object.keys(data || {}),
      });
      
      // Parse the response structure: { success: true, data: { results: [...] } }
      let songs = [];
      
      if (data.success && data.data?.results) {
        // Correct structure: data.data.results contains the songs array
        songs = Array.isArray(data.data.results) 
          ? data.data.results.filter((item: any) => item.type === 'song' || item.id)
          : [];
      } else if (data.results) {
        // Fallback: results at top level
        songs = Array.isArray(data.results) 
          ? data.results.filter((item: any) => item.type === 'song' || item.id)
          : [];
      } else if (Array.isArray(data)) {
        // Fallback: data is directly an array
        songs = data.filter((item: any) => item.type === 'song' || item.id);
      } else if (data.songs) {
        // Fallback: songs property
        songs = Array.isArray(data.songs) ? data.songs : [];
      } else if (data.data) {
        // Fallback: nested data structure
        songs = Array.isArray(data.data) ? data.data : (data.data?.songs || data.data?.results || []);
      }

      console.log(`✅ Found ${songs.length} songs from JioSaavn`);

      return NextResponse.json({ 
        songs: songs.slice(0, parseInt(limit)),
        total: songs.length 
      }, { status: 200 });
    } catch (parseError: any) {
      console.error('Error parsing response:', parseError);
      // Return empty results if parsing fails
      return NextResponse.json({ 
        songs: [],
        total: 0,
        error: 'Failed to parse API response'
      }, { status: 200 });
    }

  } catch (error: any) {
    console.error('❌ Error fetching from JioSaavn API:', error.message);
    
    // Handle timeout errors
    if (error.name === 'AbortError' || error.message?.includes('timeout') || error.message?.includes('aborted')) {
      // Return empty results instead of error for timeout
      return NextResponse.json({ 
        songs: [],
        total: 0,
        error: 'Request timed out'
      }, { status: 200 });
    }

    // For other errors, return empty results gracefully instead of 500
    return NextResponse.json({ 
      songs: [],
      total: 0,
      error: 'Failed to fetch songs'
    }, { status: 200 });
  }
}


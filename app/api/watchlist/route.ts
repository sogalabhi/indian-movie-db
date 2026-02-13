import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/watchlist
 * Get user's watchlist
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    const { data: watchlist, error } = await supabase
      .from('watchlists')
      .select('*')
      .eq('user_id', user.uid)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Transform to camelCase
    const transformed = (watchlist || []).map((item: any) => ({
      id: `${item.user_id}_${item.movie_id}`, // For compatibility
      userId: item.user_id,
      movieId: item.movie_id,
      createdAt: item.created_at,
    }));

    return NextResponse.json({ watchlist: transformed });
  } catch (error: any) {
    console.error('Error fetching watchlist:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch watchlist' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/watchlist
 * Add movie to watchlist
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { movieId } = body;

    if (!movieId) {
      return NextResponse.json(
        { error: 'Movie ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check if already in watchlist
    const { data: existing } = await supabase
      .from('watchlists')
      .select('*')
      .eq('user_id', user.uid)
      .eq('movie_id', String(movieId))
      .single();
    
    if (existing) {
      return NextResponse.json(
        { error: 'Movie already in watchlist' },
        { status: 400 }
      );
    }

    // Add to watchlist (using INSERT with ON CONFLICT for safety)
    const { data: watchlistItem, error: insertError } = await supabase
      .from('watchlists')
      .insert({
        user_id: user.uid,
        movie_id: String(movieId),
      })
      .select()
      .single();

    if (insertError) {
      // Check if it's a unique constraint violation (already exists)
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Movie already in watchlist' },
          { status: 400 }
        );
      }
      throw insertError;
    }

    return NextResponse.json({ 
      success: true,
      watchlistItem: {
        id: `${watchlistItem.user_id}_${watchlistItem.movie_id}`,
        userId: watchlistItem.user_id,
        movieId: watchlistItem.movie_id,
      }
    });
  } catch (error: any) {
    console.error('Error adding to watchlist:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add to watchlist' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/watchlist
 * Remove movie from watchlist
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const movieId = searchParams.get('movieId');

    if (!movieId) {
      return NextResponse.json(
        { error: 'Movie ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check if exists
    const { data: existing } = await supabase
      .from('watchlists')
      .select('*')
      .eq('user_id', user.uid)
      .eq('movie_id', movieId)
      .single();
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Movie not in watchlist' },
        { status: 404 }
      );
    }

    // Verify ownership (RLS should handle this, but double-check)
    if (existing.user_id !== user.uid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete from watchlist
    const { error: deleteError } = await supabase
      .from('watchlists')
      .delete()
      .eq('user_id', user.uid)
      .eq('movie_id', movieId);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing from watchlist:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove from watchlist' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/watchlist/[movieId]
 * Check if movie is in user's watchlist
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ movieId: string }> }
) {
  try {
    const user = await getCurrentUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ inWatchlist: false });
    }

    const { movieId } = await params;
    const supabase = createServerClient();

    const { data } = await supabase
      .from('watchlists')
      .select('*')
      .eq('user_id', user.uid)
      .eq('movie_id', movieId)
      .single();
    
    return NextResponse.json({ inWatchlist: !!data });
  } catch (error: any) {
    // If no row found, return false (not an error)
    if (error.code === 'PGRST116') {
      return NextResponse.json({ inWatchlist: false });
    }
    console.error('Error checking watchlist:', error);
    return NextResponse.json({ inWatchlist: false });
  }
}

/**
 * DELETE /api/watchlist/[movieId]
 * Remove specific movie from watchlist
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ movieId: string }> }
) {
  try {
    const user = await getCurrentUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { movieId } = await params;
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

    // Verify ownership (RLS should handle this)
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

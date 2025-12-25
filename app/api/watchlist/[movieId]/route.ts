import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth/server';
import { adminDb } from '@/lib/firebase/server';

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
    const docId = `${user.uid}_${movieId}`;

    const doc = await adminDb.collection('watchlists').doc(docId).get();
    
    return NextResponse.json({ inWatchlist: doc.exists });
  } catch (error: any) {
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
    const docId = `${user.uid}_${movieId}`;

    const docRef = adminDb.collection('watchlists').doc(docId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Movie not in watchlist' },
        { status: 404 }
      );
    }

    // Verify ownership
    const data = doc.data();
    if (data?.userId !== user.uid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await docRef.delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing from watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove from watchlist' },
      { status: 500 }
    );
  }
}

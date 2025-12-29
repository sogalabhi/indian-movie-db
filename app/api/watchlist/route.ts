import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth/server';
import { adminDb } from '@/lib/firebase/server';
import { getAuthCookie } from '@/lib/auth/cookies';

interface WatchlistItemData {
  userId: string;
  movieId: string;
  createdAt: any; // Firestore Timestamp or Date
}

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

    // Get watchlist items for this user
    // Note: We fetch without orderBy to avoid requiring a composite index,
    // then sort in memory instead
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      );
    }

    const watchlistRef = adminDb.collection('watchlists');
    const snapshot = await watchlistRef
      .where('userId', '==', user.uid)
      .get();

    const watchlist = snapshot.docs
      .map((doc) => {
        const data = doc.data() as WatchlistItemData;
        return {
          id: doc.id,
          ...data,
        };
      })
      .sort((a, b) => {
        // Sort by createdAt descending (newest first)
        const aTime = a.createdAt?.toMillis?.() || a.createdAt?.getTime?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || b.createdAt?.getTime?.() || 0;
        return bTime - aTime;
      });

    return NextResponse.json({ watchlist });
  } catch (error: any) {
    console.error('Error fetching watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
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

    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      );
    }

    // Create composite document ID
    const docId = `${user.uid}_${movieId}`;

    // Check if already in watchlist
    const existingDoc = await adminDb.collection('watchlists').doc(docId).get();
    
    if (existingDoc.exists) {
      return NextResponse.json(
        { error: 'Movie already in watchlist' },
        { status: 400 }
      );
    }

    // Add to watchlist
    await adminDb.collection('watchlists').doc(docId).set({
      userId: user.uid,
      movieId: String(movieId),
      createdAt: new Date(),
    });

    return NextResponse.json({ 
      success: true,
      watchlistItem: {
        id: docId,
        userId: user.uid,
        movieId: String(movieId),
      }
    });
  } catch (error: any) {
    console.error('Error adding to watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to add to watchlist' },
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

    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      );
    }

    // Create composite document ID
    const docId = `${user.uid}_${movieId}`;

    // Check if exists
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

    // Delete from watchlist
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

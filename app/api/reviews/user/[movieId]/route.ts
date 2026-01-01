import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth/server';
import { adminDb } from '@/lib/firebase/server';

interface ReviewData {
  userId: string;
  movieId: string;
  rating: number;
  body?: string;
  watchedAt: any;
  likesCount: number;
  createdAt: any;
  updatedAt: any;
}

/**
 * GET /api/reviews/user/[movieId]
 * Get review for specific movie (for current user)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ movieId: string }> }
) {
  try {
    const user = await getCurrentUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ review: null });
    }

    const { movieId } = await params;

    if (!adminDb) {
      return NextResponse.json({ review: null });
    }

    const reviewsRef = adminDb.collection('reviews');
    const snapshot = await reviewsRef
      .where('userId', '==', user.uid)
      .where('movieId', '==', movieId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ review: null });
    }

    const doc = snapshot.docs[0];
    const data = doc.data() as ReviewData;

    return NextResponse.json({
      review: {
        id: doc.id,
        ...data,
      },
    });
  } catch (error: any) {
    console.error('Error fetching review:', error);
    return NextResponse.json({ review: null });
  }
}

/**
 * PUT /api/reviews/user/[movieId]
 * Update review
 */
export async function PUT(
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
    const body = await request.json();
    const { rating, body: reviewBody, watchedAt } = body;

    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      );
    }

    // Find existing review
    const reviewsRef = adminDb.collection('reviews');
    const snapshot = await reviewsRef
      .where('userId', '==', user.uid)
      .where('movieId', '==', movieId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    const doc = snapshot.docs[0];
    const existingData = doc.data() as ReviewData;

    // Validate rating if provided
    if (rating !== undefined) {
      if (typeof rating !== 'number' || rating < 1 || rating > 10) {
        return NextResponse.json(
          { error: 'Rating must be between 1 and 10' },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: Partial<ReviewData> = {
      updatedAt: new Date(),
    };

    if (rating !== undefined) {
      updateData.rating = rating;
    }

    if (reviewBody !== undefined) {
      updateData.body = reviewBody;
    }

    if (watchedAt !== undefined) {
      updateData.watchedAt = new Date(watchedAt);
    }

    await doc.ref.update(updateData);

    return NextResponse.json({
      success: true,
      review: {
        id: doc.id,
        ...existingData,
        ...updateData,
      },
    });
  } catch (error: any) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reviews/user/[movieId]
 * Delete review (mark as unwatched)
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

    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      );
    }

    // Find existing review
    const reviewsRef = adminDb.collection('reviews');
    const snapshot = await reviewsRef
      .where('userId', '==', user.uid)
      .where('movieId', '==', movieId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    // Verify ownership
    if (data?.userId !== user.uid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete review
    await doc.ref.delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}


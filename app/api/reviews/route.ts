import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth/server';
import { adminDb } from '@/lib/firebase/server';

interface ReviewData {
  userId: string;
  movieId: string;
  rating: number; // 1-10 (required)
  body?: string; // Optional review text
  watchedAt: any; // Firestore Timestamp or Date
  likesCount: number; // Denormalized (default: 0)
  helpfulCount: number; // New: count of helpful votes (default: 0)
  notHelpfulCount: number; // New: count of not helpful votes (default: 0)
  commentsCount: number; // New: denormalized comment count (default: 0)
  createdAt: any; // Firestore Timestamp or Date
  updatedAt: any; // Firestore Timestamp or Date
}

/**
 * GET /api/reviews
 * Get user's reviews/watched history
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

    const { searchParams } = new URL(request.url);
    const movieId = searchParams.get('movieId');

    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      );
    }

    const reviewsRef = adminDb.collection('reviews');
    let query = reviewsRef.where('userId', '==', user.uid);

    // Filter by movieId if provided
    if (movieId) {
      query = query.where('movieId', '==', String(movieId));
    }

    const snapshot = await query.get();

    const reviews = snapshot.docs
      .map((doc) => {
        const data = doc.data() as ReviewData;
        return {
          id: doc.id,
          ...data,
        };
      })
      .sort((a, b) => {
        // Sort by watchedAt descending (newest first)
        const aTime = a.watchedAt?.toMillis?.() || a.watchedAt?.getTime?.() || 0;
        const bTime = b.watchedAt?.toMillis?.() || b.watchedAt?.getTime?.() || 0;
        return bTime - aTime;
      });

    return NextResponse.json({ reviews });
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews
 * Create or update review
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
    const { movieId, rating, body: reviewBody, watchedAt } = body;

    // Validation
    if (!movieId) {
      return NextResponse.json(
        { error: 'Movie ID is required' },
        { status: 400 }
      );
    }

    if (!rating || typeof rating !== 'number') {
      return NextResponse.json(
        { error: 'Rating is required and must be a number' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 10) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 10' },
        { status: 400 }
      );
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      );
    }

    // Check if review already exists (one review per user per movie)
    const reviewsRef = adminDb.collection('reviews');
    const existingQuery = await reviewsRef
      .where('userId', '==', user.uid)
      .where('movieId', '==', String(movieId))
      .get();

    const now = new Date();
    const watchedDate = watchedAt ? new Date(watchedAt) : now;

    if (existingQuery.empty) {
      // Create new review
      const newReview: ReviewData = {
        userId: user.uid,
        movieId: String(movieId),
        rating,
        body: reviewBody || '',
        watchedAt: watchedDate,
        likesCount: 0,
        helpfulCount: 0,
        notHelpfulCount: 0,
        commentsCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await reviewsRef.add(newReview);
      
      return NextResponse.json({
        success: true,
        review: {
          id: docRef.id,
          ...newReview,
        },
      });
    } else {
      // Update existing review
      const existingDoc = existingQuery.docs[0];
      const existingData = existingDoc.data() as ReviewData;

      const updatedReview: Partial<ReviewData> = {
        rating,
        body: reviewBody !== undefined ? reviewBody : existingData.body,
        watchedAt: watchedDate,
        updatedAt: now,
      };

      await existingDoc.ref.update(updatedReview);

      return NextResponse.json({
        success: true,
        review: {
          id: existingDoc.id,
          ...existingData,
          ...updatedReview,
        },
      });
    }
  } catch (error: any) {
    console.error('Error creating/updating review:', error);
    return NextResponse.json(
      { error: 'Failed to save review' },
      { status: 500 }
    );
  }
}


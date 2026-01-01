import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth/server';
import { adminDb } from '@/lib/firebase/server';

/**
 * POST /api/reviews/[reviewId]/helpful
 * Vote helpful/not helpful on a review
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const user = await getCurrentUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { reviewId } = await params;
    const body = await request.json();
    const { helpful } = body;

    if (!reviewId) {
      return NextResponse.json(
        { error: 'Review ID is required' },
        { status: 400 }
      );
    }

    if (typeof helpful !== 'boolean') {
      return NextResponse.json(
        { error: 'Helpful value must be a boolean' },
        { status: 400 }
      );
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      );
    }

    const helpfulDocId = `${user.uid}_${reviewId}`;
    const helpfulnessRef = adminDb.collection('reviewHelpfulness');
    const helpfulDoc = await helpfulnessRef.doc(helpfulDocId).get();
    const reviewRef = adminDb.collection('reviews').doc(reviewId);
    const reviewDoc = await reviewRef.get();

    if (!reviewDoc.exists) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    const reviewData = reviewDoc.data();
    let helpfulCount = (reviewData?.helpfulCount as number) || 0;
    let notHelpfulCount = (reviewData?.notHelpfulCount as number) || 0;

    if (helpfulDoc.exists) {
      const existingData = helpfulDoc.data();
      const previousHelpful = existingData?.helpful as boolean;

      // If changing vote, adjust counts
      if (previousHelpful !== helpful) {
        if (previousHelpful) {
          // Was helpful, now not helpful
          helpfulCount = Math.max(0, helpfulCount - 1);
          notHelpfulCount += 1;
        } else {
          // Was not helpful, now helpful
          notHelpfulCount = Math.max(0, notHelpfulCount - 1);
          helpfulCount += 1;
        }
      } else {
        // Same vote, no change needed
        return NextResponse.json({
          helpful,
          helpfulCount,
          notHelpfulCount,
        });
      }
    } else {
      // New vote
      if (helpful) {
        helpfulCount += 1;
      } else {
        notHelpfulCount += 1;
      }
    }

    // Update or create helpfulness document
    await helpfulnessRef.doc(helpfulDocId).set({
      userId: user.uid,
      reviewId,
      helpful,
      createdAt: new Date(),
    });

    // Update review counts
    await reviewRef.update({
      helpfulCount,
      notHelpfulCount,
    });

    return NextResponse.json({
      helpful,
      helpfulCount,
      notHelpfulCount,
    });
  } catch (error: any) {
    console.error('Error voting helpful:', error);
    return NextResponse.json(
      { error: 'Failed to vote helpful' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reviews/[reviewId]/helpful
 * Remove helpfulness vote
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const user = await getCurrentUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { reviewId } = await params;

    if (!reviewId) {
      return NextResponse.json(
        { error: 'Review ID is required' },
        { status: 400 }
      );
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      );
    }

    const helpfulDocId = `${user.uid}_${reviewId}`;
    const helpfulnessRef = adminDb.collection('reviewHelpfulness');
    const helpfulDoc = await helpfulnessRef.doc(helpfulDocId).get();

    if (!helpfulDoc.exists) {
      // No vote to remove, return current counts
      const reviewRef = adminDb.collection('reviews').doc(reviewId);
      const reviewDoc = await reviewRef.get();
      const reviewData = reviewDoc.data();
      return NextResponse.json({
        helpfulCount: (reviewData?.helpfulCount as number) || 0,
        notHelpfulCount: (reviewData?.notHelpfulCount as number) || 0,
      });
    }

    const existingData = helpfulDoc.data();
    const wasHelpful = existingData?.helpful as boolean;

    // Delete helpfulness document
    await helpfulDoc.ref.delete();

    // Update review counts
    const reviewRef = adminDb.collection('reviews').doc(reviewId);
    const reviewDoc = await reviewRef.get();
    const reviewData = reviewDoc.data();
    let helpfulCount = (reviewData?.helpfulCount as number) || 0;
    let notHelpfulCount = (reviewData?.notHelpfulCount as number) || 0;

    if (wasHelpful) {
      helpfulCount = Math.max(0, helpfulCount - 1);
    } else {
      notHelpfulCount = Math.max(0, notHelpfulCount - 1);
    }

    await reviewRef.update({
      helpfulCount,
      notHelpfulCount,
    });

    return NextResponse.json({
      helpfulCount,
      notHelpfulCount,
    });
  } catch (error: any) {
    console.error('Error removing helpfulness vote:', error);
    return NextResponse.json(
      { error: 'Failed to remove helpfulness vote' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reviews/[reviewId]/helpful
 * Get current user's helpfulness vote
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const user = await getCurrentUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { reviewId } = await params;

    if (!reviewId) {
      return NextResponse.json(
        { error: 'Review ID is required' },
        { status: 400 }
      );
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      );
    }

    const helpfulDocId = `${user.uid}_${reviewId}`;
    const helpfulnessRef = adminDb.collection('reviewHelpfulness');
    const helpfulDoc = await helpfulnessRef.doc(helpfulDocId).get();

    if (!helpfulDoc.exists) {
      return NextResponse.json({ helpful: null });
    }

    const data = helpfulDoc.data();
    return NextResponse.json({ helpful: data?.helpful as boolean });
  } catch (error: any) {
    console.error('Error checking helpfulness vote:', error);
    return NextResponse.json(
      { error: 'Failed to check helpfulness vote' },
      { status: 500 }
    );
  }
}


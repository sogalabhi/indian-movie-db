import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth/server';
import { likeTarget, unlikeTarget, checkLiked } from '@/lib/likes/like-utils';

/**
 * POST /api/reviews/[reviewId]/like
 * Like a review
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

    if (!reviewId) {
      return NextResponse.json(
        { error: 'Review ID is required' },
        { status: 400 }
      );
    }

    const result = await likeTarget('review', reviewId, user.uid);

    return NextResponse.json({
      liked: true,
      likesCount: result.likesCount,
    });
  } catch (error: any) {
    console.error('Error liking review:', error);
    return NextResponse.json(
      { error: 'Failed to like review' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reviews/[reviewId]/like
 * Unlike a review
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

    const result = await unlikeTarget('review', reviewId, user.uid);

    return NextResponse.json({
      liked: false,
      likesCount: result.likesCount,
    });
  } catch (error: any) {
    console.error('Error unliking review:', error);
    return NextResponse.json(
      { error: 'Failed to unlike review' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reviews/[reviewId]/like
 * Check if current user liked the review
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

    const liked = await checkLiked('review', reviewId, user.uid);

    return NextResponse.json({ liked });
  } catch (error: any) {
    console.error('Error checking like status:', error);
    return NextResponse.json(
      { error: 'Failed to check like status' },
      { status: 500 }
    );
  }
}


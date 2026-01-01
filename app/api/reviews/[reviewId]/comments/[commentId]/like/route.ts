import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth/server';
import { likeTarget, unlikeTarget, checkLiked } from '@/lib/likes/like-utils';

/**
 * POST /api/reviews/[reviewId]/comments/[commentId]/like
 * Like a comment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string; commentId: string }> }
) {
  try {
    const user = await getCurrentUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { commentId } = await params;

    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      );
    }

    const result = await likeTarget('comment', commentId, user.uid);

    return NextResponse.json({
      liked: true,
      likesCount: result.likesCount,
    });
  } catch (error: any) {
    console.error('Error liking comment:', error);
    return NextResponse.json(
      { error: 'Failed to like comment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reviews/[reviewId]/comments/[commentId]/like
 * Unlike a comment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string; commentId: string }> }
) {
  try {
    const user = await getCurrentUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { commentId } = await params;

    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      );
    }

    const result = await unlikeTarget('comment', commentId, user.uid);

    return NextResponse.json({
      liked: false,
      likesCount: result.likesCount,
    });
  } catch (error: any) {
    console.error('Error unliking comment:', error);
    return NextResponse.json(
      { error: 'Failed to unlike comment' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reviews/[reviewId]/comments/[commentId]/like
 * Check if current user liked the comment
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string; commentId: string }> }
) {
  try {
    const user = await getCurrentUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { commentId } = await params;

    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      );
    }

    const liked = await checkLiked('comment', commentId, user.uid);

    return NextResponse.json({ liked });
  } catch (error: any) {
    console.error('Error checking like status:', error);
    return NextResponse.json(
      { error: 'Failed to check like status' },
      { status: 500 }
    );
  }
}


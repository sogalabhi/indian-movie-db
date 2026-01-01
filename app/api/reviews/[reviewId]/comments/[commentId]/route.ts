import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth/server';
import { adminDb } from '@/lib/firebase/server';

/**
 * PUT /api/reviews/[reviewId]/comments/[commentId]
 * Update a comment (own comments only, within 15 minutes)
 */
export async function PUT(
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

    const { reviewId, commentId } = await params;
    const body = await request.json();
    const { body: commentBody } = body;

    if (!reviewId || !commentId) {
      return NextResponse.json(
        { error: 'Review ID and Comment ID are required' },
        { status: 400 }
      );
    }

    if (!commentBody || typeof commentBody !== 'string' || commentBody.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment body is required' },
        { status: 400 }
      );
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      );
    }

    const commentsRef = adminDb.collection('reviewComments');
    const commentDoc = await commentsRef.doc(commentId).get();

    if (!commentDoc.exists) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    const commentData = commentDoc.data();
    
    // Check ownership
    if (commentData?.userId !== user.uid) {
      return NextResponse.json(
        { error: 'You can only edit your own comments' },
        { status: 403 }
      );
    }

    // Check time limit (15 minutes)
    const createdAt = commentData?.createdAt?.toMillis?.() || commentData?.createdAt?.getTime?.() || new Date(commentData?.createdAt).getTime();
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    
    if (createdAt < fifteenMinutesAgo) {
      return NextResponse.json(
        { error: 'Comments can only be edited within 15 minutes of creation' },
        { status: 403 }
      );
    }

    // Character limit check
    const maxLength = commentData?.parentId ? 500 : 1000;
    if (commentBody.length > maxLength) {
      return NextResponse.json(
        { error: `Comment must be ${maxLength} characters or less` },
        { status: 400 }
      );
    }

    // Update comment
    await commentDoc.ref.update({
      body: commentBody.trim(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      comment: {
        id: commentId,
        ...commentData,
        body: commentBody.trim(),
        updatedAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reviews/[reviewId]/comments/[commentId]
 * Delete a comment (own comments only)
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

    const { reviewId, commentId } = await params;

    if (!reviewId || !commentId) {
      return NextResponse.json(
        { error: 'Review ID and Comment ID are required' },
        { status: 400 }
      );
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      );
    }

    const commentsRef = adminDb.collection('reviewComments');
    const commentDoc = await commentsRef.doc(commentId).get();

    if (!commentDoc.exists) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    const commentData = commentDoc.data();
    
    // Check ownership
    if (commentData?.userId !== user.uid) {
      return NextResponse.json(
        { error: 'You can only delete your own comments' },
        { status: 403 }
      );
    }

    // Delete comment
    await commentDoc.ref.delete();

    // Decrement commentsCount on review
    const reviewRef = adminDb.collection('reviews').doc(reviewId);
    const reviewDoc = await reviewRef.get();
    
    if (reviewDoc.exists) {
      const reviewData = reviewDoc.data();
      const currentCount = (reviewData?.commentsCount as number) || 0;
      await reviewRef.update({
        commentsCount: Math.max(0, currentCount - 1),
      });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}


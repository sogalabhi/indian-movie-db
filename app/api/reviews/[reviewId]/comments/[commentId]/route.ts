import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth/server';
import { createServerClient } from '@/lib/supabase/server';

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

    const supabase = createServerClient();

    // Get existing comment
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', commentId)
      .eq('target_type', 'review')
      .eq('target_id', reviewId)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (comment.user_id !== user.uid) {
      return NextResponse.json(
        { error: 'You can only edit your own comments' },
        { status: 403 }
      );
    }

    // Check time limit (15 minutes)
    const createdAt = new Date(comment.created_at).getTime();
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    
    if (createdAt < fifteenMinutesAgo) {
      return NextResponse.json(
        { error: 'Comments can only be edited within 15 minutes of creation' },
        { status: 403 }
      );
    }

    // Character limit check
    const maxLength = comment.parent_id ? 500 : 1000;
    if (commentBody.length > maxLength) {
      return NextResponse.json(
        { error: `Comment must be ${maxLength} characters or less` },
        { status: 400 }
      );
    }

    // Update comment
    const { data: updatedComment, error: updateError } = await supabase
      .from('comments')
      .update({
        body: commentBody.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Transform to camelCase
    const transformed = {
      id: updatedComment.id,
      userId: updatedComment.user_id,
      reviewId: updatedComment.target_id,
      parentId: updatedComment.parent_id,
      body: updatedComment.body,
      likesCount: updatedComment.likes_count || 0,
      createdAt: updatedComment.created_at,
      updatedAt: updatedComment.updated_at,
    };

    return NextResponse.json({
      success: true,
      comment: transformed,
    });
  } catch (error: any) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update comment' },
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

    const supabase = createServerClient();

    // Get existing comment
    const { data: comment } = await supabase
      .from('comments')
      .select('*')
      .eq('id', commentId)
      .eq('target_type', 'review')
      .eq('target_id', reviewId)
      .single();

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (comment.user_id !== user.uid) {
      return NextResponse.json(
        { error: 'You can only delete your own comments' },
        { status: 403 }
      );
    }

    // Delete comment
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      throw deleteError;
    }

    // Decrement comments_count on review
    const { data: reviewData } = await supabase
      .from('reviews')
      .select('comments_count')
      .eq('id', reviewId)
      .single();

    if (reviewData) {
      const currentCount = reviewData.comments_count || 0;
      await supabase
        .from('reviews')
        .update({ comments_count: Math.max(0, currentCount - 1) })
        .eq('id', reviewId);
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete comment' },
      { status: 500 }
    );
  }
}

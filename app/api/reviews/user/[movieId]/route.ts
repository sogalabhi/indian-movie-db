import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth/server';
import { createServerClient } from '@/lib/supabase/server';

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
    const supabase = createServerClient();

    const { data: review, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', user.uid)
      .eq('movie_id', movieId)
      .single();

    if (error || !review) {
      return NextResponse.json({ review: null });
    }

    // Transform to camelCase
    return NextResponse.json({
      review: {
        id: review.id,
        userId: review.user_id,
        movieId: review.movie_id,
        rating: review.rating,
        body: review.body,
        watchedAt: review.watched_at,
        likesCount: review.likes_count || 0,
        helpfulCount: review.helpful_count || 0,
        notHelpfulCount: review.not_helpful_count || 0,
        commentsCount: review.comments_count || 0,
        createdAt: review.created_at,
        updatedAt: review.updated_at,
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

    // Validate rating if provided
    if (rating !== undefined) {
      if (typeof rating !== 'number' || rating < 1 || rating > 10) {
        return NextResponse.json(
          { error: 'Rating must be between 1 and 10' },
          { status: 400 }
        );
      }
    }

    const supabase = createServerClient();

    // Find existing review
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', user.uid)
      .eq('movie_id', movieId)
      .single();

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (rating !== undefined) {
      updateData.rating = rating;
    }

    if (reviewBody !== undefined) {
      updateData.body = reviewBody;
    }

    if (watchedAt !== undefined) {
      updateData.watched_at = new Date(watchedAt).toISOString();
    }

    const { data: updatedReview, error: updateError } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', existingReview.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Transform to camelCase
    const transformed = {
      id: updatedReview.id,
      userId: updatedReview.user_id,
      movieId: updatedReview.movie_id,
      rating: updatedReview.rating,
      body: updatedReview.body,
      watchedAt: updatedReview.watched_at,
      likesCount: updatedReview.likes_count || 0,
      helpfulCount: updatedReview.helpful_count || 0,
      notHelpfulCount: updatedReview.not_helpful_count || 0,
      commentsCount: updatedReview.comments_count || 0,
      createdAt: updatedReview.created_at,
      updatedAt: updatedReview.updated_at,
    };

    return NextResponse.json({
      success: true,
      review: transformed,
    });
  } catch (error: any) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update review' },
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
    const supabase = createServerClient();

    // Find existing review
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', user.uid)
      .eq('movie_id', movieId)
      .single();

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Verify ownership (RLS should handle this, but double-check)
    if (existingReview.user_id !== user.uid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete review
    const { error: deleteError } = await supabase
      .from('reviews')
      .delete()
      .eq('id', existingReview.id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete review' },
      { status: 500 }
    );
  }
}

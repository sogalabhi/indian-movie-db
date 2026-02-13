import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth/server';
import { createServerClient } from '@/lib/supabase/server';

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

    const supabase = createServerClient();
    
    let query = supabase
      .from('reviews')
      .select('*')
      .eq('user_id', user.uid);

    // Filter by movieId if provided
    if (movieId) {
      query = query.eq('movie_id', String(movieId));
    }

    const { data: reviews, error } = await query.order('watched_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Transform snake_case to camelCase for frontend compatibility
    const transformedReviews = (reviews || []).map((review: any) => ({
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
    }));

    return NextResponse.json({ reviews: transformedReviews });
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

    const supabase = createServerClient();
    const now = new Date().toISOString();
    const watchedDate = watchedAt ? new Date(watchedAt).toISOString() : now;

    // Check if review already exists (one review per user per movie)
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', user.uid)
      .eq('movie_id', String(movieId))
      .single();

    if (existingReview) {
      // Update existing review
      const { data: updatedReview, error: updateError } = await supabase
        .from('reviews')
        .update({
          rating,
          body: reviewBody !== undefined ? reviewBody : existingReview.body,
          watched_at: watchedDate,
          updated_at: now,
        })
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
    } else {
      // Create new review
      const { data: newReview, error: insertError } = await supabase
        .from('reviews')
        .insert({
          user_id: user.uid,
          movie_id: String(movieId),
          rating,
          body: reviewBody || '',
          watched_at: watchedDate,
          likes_count: 0,
          helpful_count: 0,
          not_helpful_count: 0,
          comments_count: 0,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Transform to camelCase
      const transformed = {
        id: newReview.id,
        userId: newReview.user_id,
        movieId: newReview.movie_id,
        rating: newReview.rating,
        body: newReview.body,
        watchedAt: newReview.watched_at,
        likesCount: newReview.likes_count || 0,
        helpfulCount: newReview.helpful_count || 0,
        notHelpfulCount: newReview.not_helpful_count || 0,
        commentsCount: newReview.comments_count || 0,
        createdAt: newReview.created_at,
        updatedAt: newReview.updated_at,
      };

      return NextResponse.json({
        success: true,
        review: transformed,
      });
    }
  } catch (error: any) {
    console.error('Error creating/updating review:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save review' },
      { status: 500 }
    );
  }
}

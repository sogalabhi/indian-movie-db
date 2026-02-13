import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/reviews/movie/[movieId]
 * Get all public reviews for a specific movie
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ movieId: string }> }
) {
  try {
    const { movieId } = await params;
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const sortBy = searchParams.get('sortBy') || 'newest';
    
    // Filter params
    const filter = searchParams.get('filter');
    const ratingMin = searchParams.get('ratingMin') ? parseInt(searchParams.get('ratingMin')!, 10) : null;
    const ratingMax = searchParams.get('ratingMax') ? parseInt(searchParams.get('ratingMax')!, 10) : null;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const supabase = createServerClient();
    
    // Start with base query
    let query = supabase
      .from('reviews')
      .select('*, profiles:user_id(username, avatar_url, email)')
      .eq('movie_id', movieId);

    // Apply filters
    if (ratingMin !== null) {
      query = query.gte('rating', ratingMin);
    }
    if (ratingMax !== null) {
      query = query.lte('rating', ratingMax);
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      query = query.lte('created_at', toDate.toISOString());
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'rating_high':
        query = query.order('rating', { ascending: false });
        break;
      case 'rating_low':
        query = query.order('rating', { ascending: true });
        break;
      case 'likes':
        query = query.order('likes_count', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data: reviews, error } = await query;

    if (error) {
      throw error;
    }

    // Apply text filter in memory (if needed)
    let filteredReviews = reviews || [];
    if (filter === 'with_text') {
      filteredReviews = filteredReviews.filter((review: any) => {
        return review.body && review.body.trim().length > 0;
      });
    }

    const total = filteredReviews.length;

    // Apply pagination
    const offset = (page - 1) * limit;
    const paginatedReviews = filteredReviews.slice(offset, offset + limit);

    // Transform to camelCase and include user data
    const reviewsWithUsers = paginatedReviews.map((review: any) => {
      const profile = review.profiles || {};
      return {
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
        user: {
          username: profile.username || 'User',
          avatarUrl: profile.avatar_url || null,
          email: profile.email || null,
        },
      };
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      reviews: reviewsWithUsers,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error: any) {
    console.error('Error fetching movie reviews:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

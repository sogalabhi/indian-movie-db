import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/reviews/[reviewId]/comments
 * Get comments for a review
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const sortBy = searchParams.get('sortBy') || 'most_helpful';

    const supabase = createServerClient();
    
    // Fetch comments for this review (using target_type='review' and target_id=reviewId)
    // Note: We're treating review comments as comments with target_type='review'
    // If you have a separate review_comments table, adjust accordingly
    let query = supabase
      .from('comments')
      .select('*, profiles:user_id(username, avatar_url)')
      .eq('target_type', 'review')
      .eq('target_id', reviewId);

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'most_liked':
      case 'most_helpful':
      default:
        query = query.order('likes_count', { ascending: false });
        break;
    }

    const { data: comments, error } = await query;

    if (error) {
      throw error;
    }

    const total = comments?.length || 0;

    // Apply pagination
    const offset = (page - 1) * limit;
    const paginatedComments = (comments || []).slice(offset, offset + limit);

    // Transform to camelCase and include user data
    const commentsWithUsers = paginatedComments.map((comment: any) => {
      const profile = comment.profiles || {};
      return {
        id: comment.id,
        userId: comment.user_id,
        reviewId: comment.target_id, // For compatibility
        parentId: comment.parent_id,
        body: comment.body,
        likesCount: comment.likes_count || 0,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        user: {
          username: profile.username || 'User',
          avatarUrl: profile.avatar_url || null,
        },
      };
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      comments: commentsWithUsers,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews/[reviewId]/comments
 * Create a comment/reply
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
    const { commentBody, parentId } = body;

    // Normalize parentId
    const hasParentId = parentId !== undefined && parentId !== null;
    const normalizedParentId = hasParentId && typeof parentId === 'string' && parentId.trim() 
      ? parentId.trim() 
      : undefined;

    if (hasParentId && !normalizedParentId) {
      return NextResponse.json(
        { error: 'Invalid parent comment ID' },
        { status: 400 }
      );
    }

    if (!reviewId) {
      return NextResponse.json(
        { error: 'Review ID is required' },
        { status: 400 }
      );
    }

    if (!commentBody || typeof commentBody !== 'string' || commentBody.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment body is required' },
        { status: 400 }
      );
    }

    // Character limit check
    const maxLength = normalizedParentId ? 500 : 1000;
    if (commentBody.length > maxLength) {
      return NextResponse.json(
        { error: `Comment must be ${maxLength} characters or less` },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check rate limiting (max 10 comments per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentComments } = await supabase
      .from('comments')
      .select('created_at')
      .eq('user_id', user.uid)
      .gte('created_at', oneHourAgo);

    if (recentComments && recentComments.length >= 10) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 10 comments per hour.' },
        { status: 429 }
      );
    }

    // Verify review exists
    const { data: review } = await supabase
      .from('reviews')
      .select('id')
      .eq('id', reviewId)
      .single();

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // If parentId is provided, verify parent comment exists
    if (normalizedParentId) {
      const { data: parentComment } = await supabase
        .from('comments')
        .select('id')
        .eq('id', normalizedParentId)
        .single();

      if (!parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        );
      }
    }

    // Create comment
    const commentData: any = {
      user_id: user.uid,
      target_type: 'review',
      target_id: reviewId,
      body: commentBody.trim(),
      likes_count: 0,
    };

    if (normalizedParentId) {
      commentData.parent_id = normalizedParentId;
    }

    const { data: newComment, error: insertError } = await supabase
      .from('comments')
      .insert(commentData)
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Increment comments_count on review
    const { data: reviewData } = await supabase
      .from('reviews')
      .select('comments_count')
      .eq('id', reviewId)
      .single();

    const currentCount = reviewData?.comments_count || 0;
    await supabase
      .from('reviews')
      .update({ comments_count: currentCount + 1 })
      .eq('id', reviewId);

    // Get user profile for response
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.uid)
      .single();

    // Transform to camelCase
    const transformed = {
      id: newComment.id,
      userId: newComment.user_id,
      reviewId: newComment.target_id,
      parentId: newComment.parent_id,
      body: newComment.body,
      likesCount: newComment.likes_count || 0,
      createdAt: newComment.created_at,
      updatedAt: newComment.updated_at,
      user: {
        username: profile?.username || 'User',
        avatarUrl: profile?.avatar_url || null,
      },
    };

    return NextResponse.json({
      success: true,
      comment: transformed,
    });
  } catch (error: any) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create comment' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth/server';
import { createServerClient } from '@/lib/supabase/server';

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

    const supabase = createServerClient();

    // Check if review exists
    const { data: review } = await supabase
      .from('reviews')
      .select('helpful_count, not_helpful_count')
      .eq('id', reviewId)
      .single();

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Check existing vote
    const { data: existingVote } = await supabase
      .from('review_helpfulness')
      .select('helpful')
      .eq('user_id', user.uid)
      .eq('review_id', reviewId)
      .single();

    let helpfulCount = review.helpful_count || 0;
    let notHelpfulCount = review.not_helpful_count || 0;

    if (existingVote) {
      const previousHelpful = existingVote.helpful;

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

        // Update vote
        const { error: updateError } = await supabase
          .from('review_helpfulness')
          .update({ helpful })
          .eq('user_id', user.uid)
          .eq('review_id', reviewId);

        if (updateError) {
          throw updateError;
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

      // Create vote
      const { error: insertError } = await supabase
        .from('review_helpfulness')
        .insert({
          user_id: user.uid,
          review_id: reviewId,
          helpful,
        });

      if (insertError) {
        throw insertError;
      }
    }

    // Update review counts
    const { error: updateError } = await supabase
      .from('reviews')
      .update({
        helpful_count: helpfulCount,
        not_helpful_count: notHelpfulCount,
      })
      .eq('id', reviewId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      helpful,
      helpfulCount,
      notHelpfulCount,
    });
  } catch (error: any) {
    console.error('Error voting helpful:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to vote helpful' },
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

    const supabase = createServerClient();

    // Get existing vote
    const { data: existingVote } = await supabase
      .from('review_helpfulness')
      .select('helpful')
      .eq('user_id', user.uid)
      .eq('review_id', reviewId)
      .single();

    if (!existingVote) {
      // No vote to remove, return current counts
      const { data: review } = await supabase
        .from('reviews')
        .select('helpful_count, not_helpful_count')
        .eq('id', reviewId)
        .single();

      return NextResponse.json({
        helpfulCount: review?.helpful_count || 0,
        notHelpfulCount: review?.not_helpful_count || 0,
      });
    }

    const wasHelpful = existingVote.helpful;

    // Delete vote
    const { error: deleteError } = await supabase
      .from('review_helpfulness')
      .delete()
      .eq('user_id', user.uid)
      .eq('review_id', reviewId);

    if (deleteError) {
      throw deleteError;
    }

    // Update review counts
    const { data: review } = await supabase
      .from('reviews')
      .select('helpful_count, not_helpful_count')
      .eq('id', reviewId)
      .single();

    let helpfulCount = review?.helpful_count || 0;
    let notHelpfulCount = review?.not_helpful_count || 0;

    if (wasHelpful) {
      helpfulCount = Math.max(0, helpfulCount - 1);
    } else {
      notHelpfulCount = Math.max(0, notHelpfulCount - 1);
    }

    const { error: updateError } = await supabase
      .from('reviews')
      .update({
        helpful_count: helpfulCount,
        not_helpful_count: notHelpfulCount,
      })
      .eq('id', reviewId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      helpfulCount,
      notHelpfulCount,
    });
  } catch (error: any) {
    console.error('Error removing helpfulness vote:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove helpfulness vote' },
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

    const supabase = createServerClient();

    const { data: vote } = await supabase
      .from('review_helpfulness')
      .select('helpful')
      .eq('user_id', user.uid)
      .eq('review_id', reviewId)
      .single();

    if (!vote) {
      return NextResponse.json({ helpful: null });
    }

    return NextResponse.json({ helpful: vote.helpful });
  } catch (error: any) {
    console.error('Error checking helpfulness vote:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check helpfulness vote' },
      { status: 500 }
    );
  }
}

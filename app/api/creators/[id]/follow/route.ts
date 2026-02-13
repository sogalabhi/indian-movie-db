import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * POST /api/creators/[id]/follow
 * Follow a creator
 * Creates follow relationship and increments followers count
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: creatorId } = await params;
    console.log(`👤 POST /api/creators/${creatorId}/follow - User: ${user.uid}`);

    const supabase = createServerClient();

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('creator_follows')
      .select('*')
      .eq('user_id', user.uid)
      .eq('creator_id', creatorId)
      .single();

    if (existingFollow) {
      console.log(`⚠️ User ${user.uid} already following creator ${creatorId}`);
      // Get current count
      const { data: creator } = await supabase
        .from('creators')
        .select('followers_count')
        .eq('id', creatorId)
        .single();

      return NextResponse.json({
        success: true,
        isFollowing: true,
        followersCount: creator?.followers_count || 0,
      });
    }

    console.log(`➕ Creating follow relationship...`);

    // Use transaction-like approach: insert follow and update count
    // First, insert the follow relationship
    const { error: insertError } = await supabase
      .from('creator_follows')
      .insert({
        user_id: user.uid,
        creator_id: creatorId,
      });

    if (insertError) {
      // Check if it's a unique constraint violation (already exists)
      if (insertError.code === '23505') {
        const { data: creator } = await supabase
          .from('creators')
          .select('followers_count')
          .eq('id', creatorId)
          .single();

        return NextResponse.json({
          success: true,
          isFollowing: true,
          followersCount: creator?.followers_count || 0,
        });
      }
      throw insertError;
    }

    // Increment followers count
    const { data: creator } = await supabase
      .from('creators')
      .select('followers_count')
      .eq('id', creatorId)
      .single();

    const currentCount = creator?.followers_count || 0;
    const { error: updateError } = await supabase
      .from('creators')
      .update({ followers_count: currentCount + 1 })
      .eq('id', creatorId);

    if (updateError) {
      throw updateError;
    }

    const newCount = currentCount + 1;

    console.log(`✅ User ${user.uid} now following creator ${creatorId}`);
    console.log(`📊 Updated followers count: ${newCount}`);

    return NextResponse.json({
      success: true,
      isFollowing: true,
      followersCount: newCount,
    });
  } catch (error: any) {
    console.error(`❌ POST /api/creators/[creatorId]/follow - Error:`, error.message);
    return NextResponse.json(
      { error: 'Failed to follow creator', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/creators/[id]/follow
 * Unfollow a creator
 * Removes follow relationship and decrements followers count
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: creatorId } = await params;
    console.log(`👤 DELETE /api/creators/${creatorId}/follow - User: ${user.uid}`);

    const supabase = createServerClient();

    // Check if following
    const { data: existingFollow } = await supabase
      .from('creator_follows')
      .select('*')
      .eq('user_id', user.uid)
      .eq('creator_id', creatorId)
      .single();

    if (!existingFollow) {
      console.log(`⚠️ User ${user.uid} not following creator ${creatorId}`);
      // Get current count
      const { data: creator } = await supabase
        .from('creators')
        .select('followers_count')
        .eq('id', creatorId)
        .single();

      return NextResponse.json({
        success: true,
        isFollowing: false,
        followersCount: creator?.followers_count || 0,
      });
    }

    console.log(`➖ Removing follow relationship...`);

    // Delete follow relationship
    const { error: deleteError } = await supabase
      .from('creator_follows')
      .delete()
      .eq('user_id', user.uid)
      .eq('creator_id', creatorId);

    if (deleteError) {
      throw deleteError;
    }

    // Decrement followers count (but don't go below 0)
    const { data: creator } = await supabase
      .from('creators')
      .select('followers_count')
      .eq('id', creatorId)
      .single();

    const currentCount = creator?.followers_count || 0;
    const newCount = Math.max(0, currentCount - 1);

    const { error: updateError } = await supabase
      .from('creators')
      .update({ followers_count: newCount })
      .eq('id', creatorId);

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ User ${user.uid} unfollowed creator ${creatorId}`);
    console.log(`📊 Updated followers count: ${newCount}`);

    return NextResponse.json({
      success: true,
      isFollowing: false,
      followersCount: newCount,
    });
  } catch (error: any) {
    console.error(`❌ DELETE /api/creators/[creatorId]/follow - Error:`, error.message);
    return NextResponse.json(
      { error: 'Failed to unfollow creator', details: error.message },
      { status: 500 }
    );
  }
}

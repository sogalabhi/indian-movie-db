import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/creators/[id]/follow-status
 * Check if current user follows creator
 * Returns { isFollowing: boolean }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserFromRequest(request);

    // If not authenticated, return false
    if (!user) {
      return NextResponse.json({ isFollowing: false });
    }

    const { id: creatorId } = await params;
    console.log(`🔍 GET /api/creators/${creatorId}/follow-status - User: ${user.uid}`);

    const supabase = createServerClient();

    const { data: follow } = await supabase
      .from('creator_follows')
      .select('*')
      .eq('user_id', user.uid)
      .eq('creator_id', creatorId)
      .single();

    const isFollowing = !!follow;

    console.log(`${isFollowing ? '✅' : '❌'} User ${user.uid} ${isFollowing ? 'is' : 'not'} following creator ${creatorId}`);

    return NextResponse.json({ isFollowing });
  } catch (error: any) {
    // If no row found (PGRST116), return false (not an error)
    if (error.code === 'PGRST116') {
      return NextResponse.json({ isFollowing: false });
    }
    console.error(`❌ GET /api/creators/[id]/follow-status - Error:`, error.message);
    // Return false on error (safe default)
    return NextResponse.json({ isFollowing: false });
  }
}

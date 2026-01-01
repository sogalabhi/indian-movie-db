import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth/server';
import { adminDb } from '@/lib/firebase/server';

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

    if (!adminDb) {
      console.error('❌ GET /api/creators/[id]/follow-status - Database not initialized');
      return NextResponse.json({ isFollowing: false });
    }

    const followerDocId = `${user.uid}_${creatorId}`;
    const followerDoc = await adminDb.collection('creator_followers').doc(followerDocId).get();

    const isFollowing = followerDoc.exists;

    console.log(`${isFollowing ? '✅' : '❌'} User ${user.uid} ${isFollowing ? 'is' : 'not'} following creator ${creatorId}`);

    return NextResponse.json({ isFollowing });
  } catch (error: any) {
    console.error(`❌ GET /api/creators/[id]/follow-status - Error:`, error.message);
    // Return false on error (safe default)
    return NextResponse.json({ isFollowing: false });
  }
}


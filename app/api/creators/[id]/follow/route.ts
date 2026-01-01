import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth/server';
import { adminDb } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';

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

    if (!adminDb) {
      console.error('❌ POST /api/creators/[id]/follow - Database not initialized');
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      );
    }

    const followerDocId = `${user.uid}_${creatorId}`;
    const followerRef = adminDb.collection('creator_followers').doc(followerDocId);
    const creatorRef = adminDb.collection('creators').doc(creatorId);

    // Check if already following
    const followerDoc = await followerRef.get();
    if (followerDoc.exists) {
      console.log(`⚠️ User ${user.uid} already following creator ${creatorId}`);
      // Get current count
      const creatorDoc = await creatorRef.get();
      const currentCount = creatorDoc.data()?.followersCount || 0;
      return NextResponse.json({
        success: true,
        isFollowing: true,
        followersCount: currentCount,
      });
    }

    console.log(`➕ Creating follow relationship...`);

    // Use batch to ensure atomicity
    const batch = adminDb.batch();

    // Create follow relationship
    batch.set(followerRef, {
      userId: user.uid,
      creatorId: creatorId,
      followedAt: FieldValue.serverTimestamp(),
    });

    // Increment followers count
    batch.update(creatorRef, {
      followersCount: FieldValue.increment(1),
    });

    await batch.commit();

    // Get updated count
    const creatorDoc = await creatorRef.get();
    const newCount = creatorDoc.data()?.followersCount || 0;

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

    if (!adminDb) {
      console.error('❌ DELETE /api/creators/[id]/follow - Database not initialized');
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      );
    }

    const followerDocId = `${user.uid}_${creatorId}`;
    const followerRef = adminDb.collection('creator_followers').doc(followerDocId);
    const creatorRef = adminDb.collection('creators').doc(creatorId);

    // Check if following
    const followerDoc = await followerRef.get();
    if (!followerDoc.exists) {
      console.log(`⚠️ User ${user.uid} not following creator ${creatorId}`);
      // Get current count
      const creatorDoc = await creatorRef.get();
      const currentCount = creatorDoc.data()?.followersCount || 0;
      return NextResponse.json({
        success: true,
        isFollowing: false,
        followersCount: currentCount,
      });
    }

    console.log(`➖ Removing follow relationship...`);

    // Use batch to ensure atomicity
    const batch = adminDb.batch();

    // Delete follow relationship
    batch.delete(followerRef);

    // Decrement followers count (but don't go below 0)
    const creatorDoc = await creatorRef.get();
    const currentCount = creatorDoc.data()?.followersCount || 0;
    if (currentCount > 0) {
      batch.update(creatorRef, {
        followersCount: FieldValue.increment(-1),
      });
    } else {
      // Ensure it doesn't go negative
      batch.update(creatorRef, {
        followersCount: 0,
      });
    }

    await batch.commit();

    // Get updated count
    const updatedCreatorDoc = await creatorRef.get();
    const newCount = updatedCreatorDoc.data()?.followersCount || 0;

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


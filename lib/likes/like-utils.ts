import { adminDb } from '@/lib/firebase/server';

export type LikeTargetType = 'review' | 'comment' | 'article';

/**
 * Like a target (review, comment, or article)
 */
export async function likeTarget(
  targetType: LikeTargetType,
  targetId: string,
  userId: string
): Promise<{ success: boolean; likesCount: number }> {
  if (!adminDb) {
    throw new Error('Database not initialized');
  }

  const likeDocId = `${userId}_${targetId}`;
  const likesRef = adminDb.collection(`${targetType}Likes`);
  const likeDoc = await likesRef.doc(likeDocId).get();

  if (likeDoc.exists) {
    // Already liked, return current count
    const reviewRef = adminDb.collection(`${targetType}s`);
    const targetDoc = await reviewRef.doc(targetId).get();
    const likesCount = (targetDoc.data()?.likesCount as number) || 0;
    return { success: true, likesCount };
  }

  // Create like document
  const likeData: any = {
    userId,
    createdAt: new Date(),
  };
  
  // Set the appropriate ID field based on target type
  if (targetType === 'review') {
    likeData.reviewId = targetId;
  } else if (targetType === 'comment') {
    likeData.commentId = targetId;
  } else if (targetType === 'article') {
    likeData.articleId = targetId;
  }
  
  await likesRef.doc(likeDocId).set(likeData);

  // Increment likesCount on target
  const targetRef = adminDb.collection(`${targetType}s`);
  const targetDoc = await targetRef.doc(targetId);
  const targetData = await targetDoc.get();
  const currentCount = (targetData.data()?.likesCount as number) || 0;

  await targetDoc.update({
    likesCount: currentCount + 1,
  });

  return { success: true, likesCount: currentCount + 1 };
}

/**
 * Unlike a target
 */
export async function unlikeTarget(
  targetType: LikeTargetType,
  targetId: string,
  userId: string
): Promise<{ success: boolean; likesCount: number }> {
  if (!adminDb) {
    throw new Error('Database not initialized');
  }

  const likeDocId = `${userId}_${targetId}`;
  const likesRef = adminDb.collection(`${targetType}Likes`);
  const likeDoc = await likesRef.doc(likeDocId).get();

  if (!likeDoc.exists) {
    // Not liked, return current count
    const targetRef = adminDb.collection(`${targetType}s`);
    const targetDoc = await targetRef.doc(targetId).get();
    const likesCount = (targetDoc.data()?.likesCount as number) || 0;
    return { success: true, likesCount };
  }

  // Delete like document
  await likeDoc.ref.delete();

  // Decrement likesCount on target
  const targetRef = adminDb.collection(`${targetType}s`);
  const targetDoc = await targetRef.doc(targetId);
  const targetData = await targetDoc.get();
  const currentCount = (targetData.data()?.likesCount as number) || 0;

  await targetDoc.update({
    likesCount: Math.max(0, currentCount - 1),
  });

  return { success: true, likesCount: Math.max(0, currentCount - 1) };
}

/**
 * Check if user has liked a target
 */
export async function checkLiked(
  targetType: LikeTargetType,
  targetId: string,
  userId: string
): Promise<boolean> {
  if (!adminDb) {
    return false;
  }

  const likeDocId = `${userId}_${targetId}`;
  const likesRef = adminDb.collection(`${targetType}Likes`);
  const likeDoc = await likesRef.doc(likeDocId).get();

  return likeDoc.exists;
}


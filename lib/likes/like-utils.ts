import { createServerClient } from '@/lib/supabase/server';

export type LikeTargetType = 'review' | 'comment' | 'article';

/**
 * Like a target (review, comment, or article)
 */
export async function likeTarget(
  targetType: LikeTargetType,
  targetId: string,
  userId: string
): Promise<{ success: boolean; likesCount: number }> {
  const supabase = createServerClient();

  // Map target type to table names
  const likeTableMap: Record<LikeTargetType, string> = {
    review: 'review_likes',
    comment: 'comment_likes',
    article: 'article_likes',
  };

  const targetTableMap: Record<LikeTargetType, string> = {
    review: 'reviews',
    comment: 'comments',
    article: 'articles',
  };

  const likeTable = likeTableMap[targetType];
  const targetTable = targetTableMap[targetType];

  // Check if already liked
  const { data: existingLike, error: checkError } = await supabase
    .from(likeTable)
    .select('*')
    .eq('user_id', userId)
    .eq(`${targetType}_id`, targetId)
    .maybeSingle();

  if (checkError && checkError.code !== 'PGRST116') {
    throw checkError;
  }

  if (existingLike) {
    // Already liked, return current count
    const { data: target } = await supabase
      .from(targetTable)
      .select('likes_count')
      .eq('id', targetId)
      .single();

    return { success: true, likesCount: target?.likes_count || 0 };
  }

  // Create like record
  const likeData: any = {
    user_id: userId,
  };

  // Set the appropriate ID field based on target type
  if (targetType === 'review') {
    likeData.review_id = targetId;
  } else if (targetType === 'comment') {
    likeData.comment_id = targetId;
  } else if (targetType === 'article') {
    likeData.article_id = targetId;
  }

  const { error: insertError } = await supabase
    .from(likeTable)
    .insert(likeData);

  if (insertError) {
    throw insertError;
  }

  // Increment likes_count on target
  const { data: target } = await supabase
    .from(targetTable)
    .select('likes_count')
    .eq('id', targetId)
    .single();

  const currentCount = target?.likes_count || 0;
  const newCount = currentCount + 1;

  const { error: updateError } = await supabase
    .from(targetTable)
    .update({ likes_count: newCount })
    .eq('id', targetId);

  if (updateError) {
    throw updateError;
  }

  return { success: true, likesCount: newCount };
}

/**
 * Unlike a target
 */
export async function unlikeTarget(
  targetType: LikeTargetType,
  targetId: string,
  userId: string
): Promise<{ success: boolean; likesCount: number }> {
  const supabase = createServerClient();

  const likeTableMap: Record<LikeTargetType, string> = {
    review: 'review_likes',
    comment: 'comment_likes',
    article: 'article_likes',
  };

  const targetTableMap: Record<LikeTargetType, string> = {
    review: 'reviews',
    comment: 'comments',
    article: 'articles',
  };

  const likeTable = likeTableMap[targetType];
  const targetTable = targetTableMap[targetType];

  // Check if liked
  const { data: existingLike, error: checkError } = await supabase
    .from(likeTable)
    .select('*')
    .eq('user_id', userId)
    .eq(`${targetType}_id`, targetId)
    .maybeSingle();

  if (checkError && checkError.code !== 'PGRST116') {
    throw checkError;
  }

  if (!existingLike) {
    // Not liked, return current count
    const { data: target } = await supabase
      .from(targetTable)
      .select('likes_count')
      .eq('id', targetId)
      .single();

    return { success: true, likesCount: target?.likes_count || 0 };
  }

  // Delete like record
  const { error: deleteError } = await supabase
    .from(likeTable)
    .delete()
    .eq('user_id', userId)
    .eq(`${targetType}_id`, targetId);

  if (deleteError) {
    throw deleteError;
  }

  // Decrement likes_count on target
  const { data: target } = await supabase
    .from(targetTable)
    .select('likes_count')
    .eq('id', targetId)
    .single();

  const currentCount = target?.likes_count || 0;
  const newCount = Math.max(0, currentCount - 1);

  const { error: updateError } = await supabase
    .from(targetTable)
    .update({ likes_count: newCount })
    .eq('id', targetId);

  if (updateError) {
    throw updateError;
  }

  return { success: true, likesCount: newCount };
}

/**
 * Check if user has liked a target
 */
export async function checkLiked(
  targetType: LikeTargetType,
  targetId: string,
  userId: string
): Promise<boolean> {
  const supabase = createServerClient();

  const likeTableMap: Record<LikeTargetType, string> = {
    review: 'review_likes',
    comment: 'comment_likes',
    article: 'article_likes',
  };

  const likeTable = likeTableMap[targetType];

  const { data, error } = await supabase
    .from(likeTable)
    .select('*')
    .eq('user_id', userId)
    .eq(`${targetType}_id`, targetId)
    .maybeSingle();

  // Return false if no row found (not an error)
  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return !!data;
}

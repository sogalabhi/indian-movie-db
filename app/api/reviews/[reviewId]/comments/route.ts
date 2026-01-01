import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth/server';
import { adminDb, adminAuth } from '@/lib/firebase/server';

interface CommentData {
  userId: string;
  reviewId: string;
  parentId?: string;
  body: string;
  likesCount: number;
  createdAt: any;
  updatedAt: any;
}

interface UserProfile {
  username?: string;
  avatarUrl?: string | null;
}

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

    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      );
    }

    const commentsRef = adminDb.collection('reviewComments');
    
    // Fetch all comments for this review
    const allSnapshot = await commentsRef
      .where('reviewId', '==', reviewId)
      .get();

    const total = allSnapshot.size;

    // Map to comment objects
    let allComments = allSnapshot.docs.map((doc) => {
      const data = doc.data() as CommentData;
      return {
        id: doc.id,
        ...data,
      };
    });

    // Apply sorting in memory
    switch (sortBy) {
      case 'newest':
        allComments.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || a.createdAt?.getTime?.() || new Date(a.createdAt).getTime() || 0;
          const bTime = b.createdAt?.toMillis?.() || b.createdAt?.getTime?.() || new Date(b.createdAt).getTime() || 0;
          return bTime - aTime;
        });
        break;
      case 'oldest':
        allComments.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || a.createdAt?.getTime?.() || new Date(a.createdAt).getTime() || 0;
          const bTime = b.createdAt?.toMillis?.() || b.createdAt?.getTime?.() || new Date(b.createdAt).getTime() || 0;
          return aTime - bTime;
        });
        break;
      case 'most_liked':
        allComments.sort((a, b) => b.likesCount - a.likesCount);
        break;
      case 'most_helpful':
      default:
        // Sort by likes count (most helpful = most liked for now)
        allComments.sort((a, b) => b.likesCount - a.likesCount);
        break;
    }

    // Apply pagination in memory
    const offset = (page - 1) * limit;
    const comments = allComments.slice(offset, offset + limit);

    // Fetch user profiles for each comment
    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        let userProfile: UserProfile = {
          username: 'User',
          avatarUrl: null,
        };

        if (!adminDb) {
          return {
            ...comment,
            user: userProfile,
          };
        }

        try {
          const profileDoc = await adminDb.collection('profiles').doc(comment.userId).get();
          
          if (profileDoc.exists) {
            const profileData = profileDoc.data() as UserProfile;
            userProfile = {
              username: profileData.username || 'User',
              avatarUrl: profileData.avatarUrl || null,
            };
          } else {
            if (adminAuth) {
              try {
                const userRecord = await adminAuth.getUser(comment.userId);
                userProfile = {
                  username: userRecord.displayName || userRecord.email?.split('@')[0] || 'User',
                  avatarUrl: userRecord.photoURL || null,
                };
              } catch (authError) {
                console.warn(`User ${comment.userId} not found in Auth`);
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching profile for user ${comment.userId}:`, error);
        }

        return {
          ...comment,
          user: userProfile,
        };
      })
    );

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
      { error: 'Failed to fetch comments' },
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

    // Normalize parentId - convert empty string/null/undefined to undefined, but keep valid strings
    // Check if parentId was explicitly provided (even if empty string, it means it's a reply attempt)
    const hasParentId = parentId !== undefined && parentId !== null;
    const normalizedParentId = hasParentId && typeof parentId === 'string' && parentId.trim() 
      ? parentId.trim() 
      : undefined;

    // Debug logging (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('Comment creation - parentId received:', parentId, 'type:', typeof parentId, 'hasParentId:', hasParentId, 'normalized:', normalizedParentId);
    }

    // If parentId was provided but is invalid, return error
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

    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      );
    }

    // Check rate limiting (max 10 comments per hour)
    // Fetch all user comments and filter in memory to avoid composite index requirement
    const commentsRef = adminDb.collection('reviewComments');
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
     
    // Fetch all comments by user (no orderBy to avoid index requirement)
    const allUserComments = await commentsRef
      .where('userId', '==', user.uid)
      .get();

    // Filter in memory for comments created in the last hour
    const recentComments = allUserComments.docs.filter((doc) => {
      const commentData = doc.data();
      const createdAt = commentData.createdAt?.toMillis?.() 
        ? new Date(commentData.createdAt.toMillis())
        : commentData.createdAt?.getTime?.()
        ? new Date(commentData.createdAt.getTime())
        : new Date(commentData.createdAt);
      return createdAt >= oneHourAgo;
    });

    if (recentComments.length >= 10) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 10 comments per hour.' },
        { status: 429 }
      );
    }

    // Verify review exists
    const reviewRef = adminDb.collection('reviews').doc(reviewId);
    const reviewDoc = await reviewRef.get();

    if (!reviewDoc.exists) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // If parentId is provided, verify parent comment exists
    if (normalizedParentId) {
      const parentDoc = await commentsRef.doc(normalizedParentId).get();
      if (!parentDoc.exists) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        );
      }
    }

    const now = new Date();

    // Create comment
    const newComment: any = {
      userId: user.uid,
      reviewId,
      body: commentBody.trim(),
      likesCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    // Only include parentId if it's provided (Firestore doesn't allow undefined)
    if (normalizedParentId) {
      newComment.parentId = normalizedParentId;
    }

    const docRef = await commentsRef.add(newComment);

    // Increment commentsCount on review
    const reviewData = reviewDoc.data();
    const currentCount = (reviewData?.commentsCount as number) || 0;
    await reviewRef.update({
      commentsCount: currentCount + 1,
    });

    // Fetch user profile for response
    let userProfile: UserProfile = {
      username: 'User',
      avatarUrl: null,
    };

    try {
      const profileDoc = await adminDb.collection('profiles').doc(user.uid).get();
      if (profileDoc.exists) {
        const profileData = profileDoc.data() as UserProfile;
        userProfile = {
          username: profileData.username || 'User',
          avatarUrl: profileData.avatarUrl || null,
        };
      } else if (adminAuth) {
        try {
          const userRecord = await adminAuth.getUser(user.uid);
          userProfile = {
            username: userRecord.displayName || userRecord.email?.split('@')[0] || 'User',
            avatarUrl: userRecord.photoURL || null,
          };
        } catch (authError) {
          // Use default
        }
      }
    } catch (error) {
      // Use default
    }

    return NextResponse.json({
      success: true,
      comment: {
        id: docRef.id,
        ...newComment,
        user: userProfile,
      },
    });
  } catch (error: any) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}


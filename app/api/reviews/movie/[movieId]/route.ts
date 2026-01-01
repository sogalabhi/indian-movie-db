import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/server';

interface ReviewData {
  userId: string;
  movieId: string;
  rating: number;
  body?: string;
  watchedAt: any;
  likesCount: number;
  helpfulCount?: number; // New: count of helpful votes (default: 0)
  notHelpfulCount?: number; // New: count of not helpful votes (default: 0)
  commentsCount?: number; // New: denormalized comment count (default: 0)
  createdAt: any;
  updatedAt: any;
}

interface UserProfile {
  username?: string;
  avatarUrl?: string | null;
  email?: string;
}

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

    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      );
    }

    const reviewsRef = adminDb.collection('reviews');
    
    // Fetch all reviews for this movie (without orderBy to avoid composite index requirement)
    // We'll sort in memory instead
    const allSnapshot = await reviewsRef
      .where('movieId', '==', movieId)
      .get();

    // Map to review objects
    let allReviews = allSnapshot.docs.map((doc) => {
      const data = doc.data() as ReviewData;
      return {
        id: doc.id,
        ...data,
        helpfulCount: data.helpfulCount || 0,
        notHelpfulCount: data.notHelpfulCount || 0,
        commentsCount: data.commentsCount || 0,
      };
    });

    // Apply filtering in memory
    if (filter === 'with_text') {
      allReviews = allReviews.filter((review) => {
        return review.body && review.body.trim().length > 0;
      });
    }

    if (ratingMin !== null) {
      allReviews = allReviews.filter((review) => review.rating >= ratingMin);
    }

    if (ratingMax !== null) {
      allReviews = allReviews.filter((review) => review.rating <= ratingMax);
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      allReviews = allReviews.filter((review) => {
        const reviewDate = review.createdAt?.toMillis?.() 
          ? new Date(review.createdAt.toMillis())
          : review.createdAt?.getTime?.()
          ? new Date(review.createdAt.getTime())
          : new Date(review.createdAt);
        return reviewDate >= fromDate;
      });
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      allReviews = allReviews.filter((review) => {
        const reviewDate = review.createdAt?.toMillis?.() 
          ? new Date(review.createdAt.toMillis())
          : review.createdAt?.getTime?.()
          ? new Date(review.createdAt.getTime())
          : new Date(review.createdAt);
        return reviewDate <= toDate;
      });
    }

    // Update total after filtering
    const total = allReviews.length;

    // Apply sorting in memory
    switch (sortBy) {
      case 'newest':
        allReviews.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || a.createdAt?.getTime?.() || new Date(a.createdAt).getTime() || 0;
          const bTime = b.createdAt?.toMillis?.() || b.createdAt?.getTime?.() || new Date(b.createdAt).getTime() || 0;
          return bTime - aTime;
        });
        break;
      case 'oldest':
        allReviews.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || a.createdAt?.getTime?.() || new Date(a.createdAt).getTime() || 0;
          const bTime = b.createdAt?.toMillis?.() || b.createdAt?.getTime?.() || new Date(b.createdAt).getTime() || 0;
          return aTime - bTime;
        });
        break;
      case 'rating_high':
        allReviews.sort((a, b) => b.rating - a.rating);
        break;
      case 'rating_low':
        allReviews.sort((a, b) => a.rating - b.rating);
        break;
      case 'likes':
        allReviews.sort((a, b) => b.likesCount - a.likesCount);
        break;
      default:
        // Default to newest
        allReviews.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || a.createdAt?.getTime?.() || new Date(a.createdAt).getTime() || 0;
          const bTime = b.createdAt?.toMillis?.() || b.createdAt?.getTime?.() || new Date(b.createdAt).getTime() || 0;
          return bTime - aTime;
        });
    }

    // Apply pagination in memory
    const offset = (page - 1) * limit;
    const reviews = allReviews.slice(offset, offset + limit);

    // Fetch user profiles for each review
    const reviewsWithUsers = await Promise.all(
      reviews.map(async (review) => {
        let userProfile: UserProfile = {
          username: 'User',
          avatarUrl: null,
        };

        if (!adminDb) {
          return {
            ...review,
            user: userProfile,
          };
        }

        try {
          // Try to get profile from profiles collection
          const profileDoc = await adminDb.collection('profiles').doc(review.userId).get();
          
          if (profileDoc.exists) {
            const profileData = profileDoc.data() as UserProfile;
            userProfile = {
              username: profileData.username || 'User',
              avatarUrl: profileData.avatarUrl || null,
            };
          } else {
            // Fallback: try to get user from Firebase Auth
            if (adminAuth) {
              try {
                const userRecord = await adminAuth.getUser(review.userId);
                userProfile = {
                  username: userRecord.displayName || userRecord.email?.split('@')[0] || 'User',
                  avatarUrl: userRecord.photoURL || null,
                };
              } catch (authError) {
                // User might not exist in Auth anymore
                console.warn(`User ${review.userId} not found in Auth`);
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching profile for user ${review.userId}:`, error);
        }

        return {
          ...review,
          user: userProfile,
        };
      })
    );

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
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}


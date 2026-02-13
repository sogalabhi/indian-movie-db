/**
 * Creator interface representing a filmmaker/actor in the system
 * Stored in Supabase: TMDB Person ID (e.g., "1261324")
 */
export interface Creator {
  id: string; // TMDB Person ID
  name: string;
  role: string; // "Director", "Actor", "Writer", etc.
  slug: string; // URL-friendly slug (e.g., "prashanth-neel")
  profilePath: string; // Cached TMDB profile image path (e.g., "/iyG7Re0d0lC8s5xX6c6o8.jpg")
  followersCount: number; // Community follower count (default: 0)
  lastUpdated?: Date | string; // Last update timestamp
}

/**
 * CreatorFollower interface representing a follow relationship
 * Stored in Supabase: composite key (user_id, creator_id)
 */
export interface CreatorFollower {
  userId: string;
  creatorId: string; // TMDB Person ID
  followedAt: Date | string;
}

/**
 * TMDB Person API response (partial - only fields we use)
 */
export interface TMDBPerson {
  id: number;
  name: string;
  biography?: string;
  profile_path: string | null;
  birthday?: string;
  place_of_birth?: string;
  known_for_department?: string;
}


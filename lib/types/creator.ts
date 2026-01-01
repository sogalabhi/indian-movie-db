import { Timestamp } from 'firebase/firestore';

/**
 * Creator interface representing a filmmaker/actor in the system
 * Document ID in Firestore: TMDB Person ID (e.g., "1261324")
 */
export interface Creator {
  id: string; // TMDB Person ID (matches document ID)
  name: string;
  role: string; // "Director", "Actor", "Writer", etc.
  slug: string; // URL-friendly slug (e.g., "prashanth-neel")
  profilePath: string; // Cached TMDB profile image path (e.g., "/iyG7Re0d0lC8s5xX6c6o8.jpg")
  followersCount: number; // Community follower count (default: 0)
  lastUpdated?: Timestamp | Date; // Last update timestamp
}

/**
 * CreatorFollower interface representing a follow relationship
 * Document ID in Firestore: `${userId}_${creatorId}` (composite key)
 */
export interface CreatorFollower {
  userId: string;
  creatorId: string; // TMDB Person ID
  followedAt: Timestamp | Date;
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


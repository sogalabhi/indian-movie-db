/**
 * Utility functions for creator operations
 */

/**
 * Generate a URL-friendly slug from a name
 * Converts "Prashanth Neel" to "prashanth-neel"
 * Handles special characters, multiple spaces, etc.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Replace spaces and dots with hyphens
    .replace(/[\s.]+/g, '-')
    // Remove special characters except hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Replace multiple hyphens with single hyphen
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}

/**
 * Atomic increment/decrement of followers count
 * Note: This is a helper function. Actual atomic operations should be done
 * using Firestore's increment() function in the API routes.
 */
export function updateFollowersCount(
  creatorId: string,
  delta: number
): { creatorId: string; delta: number } {
  return {
    creatorId,
    delta,
  };
}

/**
 * Validate creator data before storing in Firestore
 */
export function validateCreatorData(data: Partial<{
  id: string;
  name: string;
  role: string;
  slug: string;
  profilePath: string;
  followersCount: number;
}>): boolean {
  if (!data.id || !data.name || !data.role || !data.slug) {
    return false;
  }
  
  // Profile path can be empty but should be a string if provided
  if (data.profilePath !== undefined && typeof data.profilePath !== 'string') {
    return false;
  }
  
  // Followers count should be a number >= 0
  if (data.followersCount !== undefined && (typeof data.followersCount !== 'number' || data.followersCount < 0)) {
    return false;
  }
  
  return true;
}


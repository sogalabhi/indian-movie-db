/**
 * Price calculation engine for movie stocks
 * Ported from Python service to TypeScript
 */

import { createServerClient } from '@/lib/supabase/server';

/**
 * Calculate new stock price based on indices.
 * 
 * @param oldPrice - Current stock price
 * @param hypeIndex - Hype index (0-100) - now from TMDB popularity
 * @param boxOfficeIndex - Box office performance score (0-100)
 * @param womIndex - Word of mouth/reviews score (0-100)
 * @returns New calculated price (clamped between 10-1000)
 */
export function calculateNewPrice(
  oldPrice: number,
  hypeIndex: number,
  boxOfficeIndex: number,
  womIndex: number
): number {
  // Weighted formula
  const trendScore = (hypeIndex * 0.4) + (boxOfficeIndex * 0.4) + (womIndex * 0.2);
  
  // Dampened update to prevent wild swings
  // 80% of old price + 50% of trend score
  const newPrice = (oldPrice * 0.8) + (trendScore * 0.5);
  
  // Clamp to reasonable range (10-1000)
  return Math.max(10.0, Math.min(1000.0, newPrice));
}

/**
 * Calculate 24-hour price change percentage.
 * 
 * @param newPrice - New stock price
 * @param oldPrice - Previous stock price
 * @returns Percentage change (can be negative)
 */
export function calculatePriceChange24h(newPrice: number, oldPrice: number): number {
  if (oldPrice === 0) {
    return 0.0;
  }
  return ((newPrice - oldPrice) / oldPrice) * 100;
}

/**
 * Convert TMDB popularity score to hype index (0-100).
 * TMDB popularity typically ranges from 0-500+, so we normalize it.
 * 
 * @param popularity - TMDB popularity score
 * @returns Hype index (0-100)
 */
export function calculateHypeIndexFromTMDB(popularity: number): number {
  // Normalize: popularity / 5, capped at 100
  // Example: popularity 500 -> 100, popularity 250 -> 50, popularity 50 -> 10
  return Math.min(popularity / 5, 100);
}

/**
 * Calculate Word of Mouth index from reviews.
 * 
 * Note: This is a simplified implementation. In the future, this could be enhanced
 * to consider review count, recency, sentiment analysis, etc.
 * 
 * @param movieId - TMDB movie ID
 * @returns WOM index (0-100)
 */
export async function calculateWOMIndex(movieId: string): Promise<number> {
  try {
    const supabase = createServerClient();
    
    // Try to get reviews from Supabase reviews table
    // Note: If reviews are stored elsewhere (e.g., Firestore), this will need adjustment
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('movie_id', movieId);
    
    if (error || !reviews || reviews.length === 0) {
      // No reviews found, return neutral value
      return 50.0;
    }
    
    // Calculate average rating
    const ratings = reviews
      .map((r: any) => r.rating)
      .filter((rating: number | null) => rating !== null && rating >= 1 && rating <= 10);
    
    if (ratings.length === 0) {
      return 50.0;
    }
    
    const avgRating = ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length;
    
    // Scale 1-10 rating to 0-100 index
    // Also factor in review count (more reviews = slight boost)
    const reviewCountFactor = Math.min(ratings.length / 10, 1.0); // Cap at 1.0 for 10+ reviews
    const baseIndex = (avgRating / 10) * 100;
    
    // Apply slight boost for having multiple reviews (up to 5% bonus)
    const womIndex = baseIndex + (reviewCountFactor * 5);
    
    return Math.min(100, Math.max(0, womIndex));
  } catch (error) {
    console.error(`Error calculating WOM index for ${movieId}:`, error);
    return 50.0; // Default neutral value on error
  }
}

/**
 * Calculate box office index.
 * 
 * Note: This is a placeholder. In the future, this could integrate with
 * actual box office data sources. For now, returns a neutral value.
 * 
 * @param movieId - TMDB movie ID
 * @returns Box office index (0-100)
 */
export async function calculateBoxOfficeIndex(movieId: string): Promise<number> {
  // Placeholder: Return neutral value
  // TODO: Integrate with actual box office data source if available
  return 50.0;
}


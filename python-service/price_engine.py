"""
Price calculation engine for movie stocks
"""
from typing import Tuple


def calculate_new_price(
    old_price: float,
    hype_index: float,
    box_office_index: float,
    wom_index: float
) -> float:
    """
    Calculate new stock price based on indices.
    
    Args:
        old_price: Current stock price
        hype_index: Google Trends score (0-100)
        box_office_index: Box office performance score (0-100)
        wom_index: Word of mouth/reviews score (0-100)
    
    Returns:
        New calculated price (clamped between 10-1000)
    """
    # Weighted formula
    trend_score = (hype_index * 0.4) + (box_office_index * 0.4) + (wom_index * 0.2)
    
    # Dampened update to prevent wild swings
    # 80% of old price + 50% of trend score
    new_price = (old_price * 0.8) + (trend_score * 0.5)
    
    # Clamp to reasonable range (10-1000)
    return max(10.0, min(1000.0, new_price))


def calculate_price_change_24h(new_price: float, old_price: float) -> float:
    """
    Calculate 24-hour price change percentage.
    
    Args:
        new_price: New stock price
        old_price: Previous stock price
    
    Returns:
        Percentage change (can be negative)
    """
    if old_price == 0:
        return 0.0
    return ((new_price - old_price) / old_price) * 100


def calculate_wom_index(movie_id: str, supabase_client) -> float:
    """
    Calculate Word of Mouth index from reviews.
    This is a placeholder - implement based on your review system.
    
    Args:
        movie_id: TMDB movie ID
        supabase_client: Supabase client instance
    
    Returns:
        WOM index (0-100)
    """
    # TODO: Implement WOM calculation from reviews table
    # For now, return a default value
    # You can calculate based on:
    # - Average rating (scale to 0-100)
    # - Number of reviews (more reviews = higher index)
    # - Recent review sentiment
    
    try:
        # Example: Get average rating from reviews
        # response = supabase_client.table('reviews')\
        #     .select('rating')\
        #     .eq('movie_id', movie_id)\
        #     .execute()
        # 
        # if response.data:
        #     ratings = [r['rating'] for r in response.data if r.get('rating')]
        #     if ratings:
        #         avg_rating = sum(ratings) / len(ratings)
        #         # Scale 1-10 rating to 0-100 index
        #         return (avg_rating / 10) * 100
        
        return 50.0  # Default neutral value
    except Exception as e:
        print(f"Error calculating WOM index for {movie_id}: {e}")
        return 50.0  # Default on error


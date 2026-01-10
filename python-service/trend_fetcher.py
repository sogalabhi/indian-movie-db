"""
Fetch trend data from external sources (Google Trends, Sacnilk, etc.)
"""
import asyncio
import random
from typing import Dict, Optional
from pytrends.request import TrendReq
import requests
from bs4 import BeautifulSoup


async def get_trend_score(keyword: str) -> Dict[str, float]:
    """
    Get Google Trends score for a movie title.
    
    Args:
        keyword: Movie title to search
    
    Returns:
        Dictionary with 'score' (0-100) and 'error' if any
    """
    try:
        pytrends = TrendReq(hl='en-US', tz=360, timeout=(10, 25))
        
        # Build payload for last 7 days in India
        pytrends.build_payload([keyword], timeframe='now 7-d', geo='IN')
        
        # Get interest over time
        data = pytrends.interest_over_time()
        
        if not data.empty and keyword in data.columns:
            # Return the mean popularity score (0-100)
            score = float(data[keyword].mean())
            return {"score": score, "error": None}
        else:
            return {"score": 0.0, "error": "No data available"}
            
    except Exception as e:
        print(f"Error fetching Google Trends for '{keyword}': {e}")
        return {"score": 0.0, "error": str(e)}


async def get_box_office_score(movie_title: str) -> Dict[str, float]:
    """
    Get box office performance score from Sacnilk or similar source.
    
    Args:
        movie_title: Movie title to search
    
    Returns:
        Dictionary with 'score' (0-100) and 'error' if any
    """
    try:
        # TODO: Implement Sacnilk scraping or API integration
        # For now, return a placeholder
        
        # Example implementation:
        # 1. Search Sacnilk for movie
        # 2. Get box office collection data
        # 3. Calculate score based on collection (normalize to 0-100)
        
        # Placeholder: Return random score for now
        # In production, implement actual scraping/API call
        score = random.uniform(30, 70)  # Placeholder
        
        return {"score": score, "error": None}
        
    except Exception as e:
        print(f"Error fetching box office data for '{movie_title}': {e}")
        return {"score": 0.0, "error": str(e)}


def scrape_sacnilk(movie_title: str) -> Optional[float]:
    """
    Scrape Sacnilk website for box office data.
    This is a placeholder - implement based on Sacnilk's structure.
    
    Args:
        movie_title: Movie title to search
    
    Returns:
        Box office score (0-100) or None if not found
    """
    try:
        # TODO: Implement actual scraping
        # Example:
        # url = f"https://sacnilk.com/search?q={movie_title}"
        # response = requests.get(url, headers={'User-Agent': '...'})
        # soup = BeautifulSoup(response.content, 'html.parser')
        # # Parse collection data
        # # Normalize to 0-100 scale
        # return normalized_score
        
        return None
    except Exception as e:
        print(f"Error scraping Sacnilk for '{movie_title}': {e}")
        return None


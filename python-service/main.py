"""
FastAPI service for updating movie stock prices
"""
import asyncio
import random
import os
from typing import Dict, List
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from supabase_client import get_supabase_client
from price_engine import (
    calculate_new_price,
    calculate_price_change_24h,
    calculate_wom_index
)
from trend_fetcher import get_trend_score, get_box_office_score

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Movie Stock Price Update Service",
    description="Service for updating movie stock prices based on trends",
    version="1.0.0"
)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "movie-stock-price-updater"}


@app.get("/trend")
async def get_trend(keyword: str = Query(..., description="Movie title to search")):
    """
    Get Google Trends score for a movie.
    
    Returns:
        Dictionary with 'score' (0-100) and optional 'error'
    """
    try:
        result = await get_trend_score(keyword)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching trend: {str(e)}")


@app.get("/box-office")
async def get_box_office(movie_title: str = Query(..., description="Movie title to search")):
    """
    Get box office performance score.
    
    Returns:
        Dictionary with 'score' (0-100) and optional 'error'
    """
    try:
        result = await get_box_office_score(movie_title)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching box office data: {str(e)}")


@app.post("/update-prices")
async def update_prices():
    """
    Batch update prices for all ACTIVE stocks.
    
    CRITICAL: Includes rate limiting to prevent Google Trends IP ban.
    Sleeps 5-10 seconds between requests to look human.
    """
    try:
        supabase = get_supabase_client()
        
        # Get all ACTIVE stocks
        response = supabase.table("movie_stocks").select("*").eq("status", "ACTIVE").execute()
        stocks = response.data
        
        if not stocks:
            return {"status": "success", "updated": 0, "message": "No active stocks found"}
        
        updated_count = 0
        errors = []
        
        # Process stocks with delays to avoid Google ban
        for i, stock in enumerate(stocks):
            try:
                movie_id = stock["id"]
                movie_title = stock["title"]
                
                print(f"Processing {i+1}/{len(stocks)}: {movie_title}")
                
                # Fetch trend data (with error handling)
                trend_data = await get_trend_score(movie_title)
                box_office_data = await get_box_office_score(movie_title)
                wom_data = calculate_wom_index(movie_id, supabase)
                
                # Calculate new price
                old_price = float(stock["current_price"])
                new_price = calculate_new_price(
                    old_price,
                    trend_data["score"],
                    box_office_data["score"],
                    wom_data
                )
                
                price_change_24h = calculate_price_change_24h(new_price, old_price)
                
                # Update database
                update_response = supabase.table("movie_stocks").update({
                    "current_price": new_price,
                    "price_change_24h": price_change_24h,
                    "hype_index": trend_data["score"],
                    "box_office_index": box_office_data["score"],
                    "wom_index": wom_data,
                    "last_updated": "now()"
                }).eq("id", movie_id).execute()
                
                # Save history point
                supabase.table("market_history").insert({
                    "movie_id": movie_id,
                    "price": new_price
                }).execute()
                
                updated_count += 1
                print(f"✓ Updated {movie_title}: ₹{old_price:.2f} → ₹{new_price:.2f} ({price_change_24h:+.2f}%)")
                
                # 🔒 CRITICAL: Sleep 5-10 seconds between requests to look human
                # Only sleep if not the last item
                if i < len(stocks) - 1:
                    sleep_time = random.uniform(5, 10)
                    print(f"  Sleeping {sleep_time:.1f}s before next request...")
                    await asyncio.sleep(sleep_time)
                    
            except Exception as e:
                error_msg = f"Error updating stock {stock.get('id', 'unknown')}: {str(e)}"
                print(f"✗ {error_msg}")
                errors.append(error_msg)
                continue
        
        return {
            "status": "success",
            "updated": updated_count,
            "total": len(stocks),
            "errors": errors if errors else None
        }
        
    except Exception as e:
        print(f"Fatal error in update_prices: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating prices: {str(e)}")


@app.post("/update-prices-batch")
async def update_prices_batch(batch_size: int = Query(5, ge=1, le=10, description="Number of stocks to update")):
    """
    Update a small batch of stocks. Call this every 5 minutes via cron.
    Uses round-robin to cycle through all stocks over time.
    
    This is the recommended endpoint for production to avoid Google Trends bans.
    """
    try:
        supabase = get_supabase_client()
        
        # Get stocks that haven't been updated recently (round-robin)
        # Order by last_updated ascending to get oldest first
        response = supabase.table("movie_stocks")\
            .select("*")\
            .eq("status", "ACTIVE")\
            .order("last_updated", desc=False)\
            .limit(batch_size)\
            .execute()
        
        stocks = response.data
        
        if not stocks:
            return {"status": "success", "updated": 0, "message": "No active stocks found"}
        
        updated_count = 0
        errors = []
        
        for i, stock in enumerate(stocks):
            try:
                movie_id = stock["id"]
                movie_title = stock["title"]
                
                print(f"Processing batch {i+1}/{len(stocks)}: {movie_title}")
                
                # Fetch trend data
                trend_data = await get_trend_score(movie_title)
                box_office_data = await get_box_office_score(movie_title)
                wom_data = calculate_wom_index(movie_id, supabase)
                
                # Calculate new price
                old_price = float(stock["current_price"])
                new_price = calculate_new_price(
                    old_price,
                    trend_data["score"],
                    box_office_data["score"],
                    wom_data
                )
                
                price_change_24h = calculate_price_change_24h(new_price, old_price)
                
                # Update database
                supabase.table("movie_stocks").update({
                    "current_price": new_price,
                    "price_change_24h": price_change_24h,
                    "hype_index": trend_data["score"],
                    "box_office_index": box_office_data["score"],
                    "wom_index": wom_data,
                    "last_updated": "now()"
                }).eq("id", movie_id).execute()
                
                # Save history point
                supabase.table("market_history").insert({
                    "movie_id": movie_id,
                    "price": new_price
                }).execute()
                
                updated_count += 1
                
                # Sleep 5-10 seconds between each
                if i < len(stocks) - 1:
                    sleep_time = random.uniform(5, 10)
                    await asyncio.sleep(sleep_time)
                    
            except Exception as e:
                error_msg = f"Error updating stock {stock.get('id', 'unknown')}: {str(e)}"
                print(f"✗ {error_msg}")
                errors.append(error_msg)
                continue
        
        return {
            "status": "success",
            "updated": updated_count,
            "total": len(stocks),
            "errors": errors if errors else None
        }
        
    except Exception as e:
        print(f"Fatal error in update_prices_batch: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating prices: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)


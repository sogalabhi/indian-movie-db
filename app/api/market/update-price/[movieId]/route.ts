import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import axios from 'axios';
import {
  calculateNewPrice,
  calculatePriceChange24h,
  calculateHypeIndexFromTMDB,
  calculateWOMIndex,
  calculateBoxOfficeIndex,
} from '@/lib/market/price-calculator';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const UPDATE_THRESHOLD_HOURS = 1; // Update if last_updated is older than 1 hour

/**
 * POST /api/market/update-price/[movieId]
 * Lazy update price for a single stock.
 * Only updates if last_updated is older than UPDATE_THRESHOLD_HOURS.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ movieId: string }> }
) {
  try {
    const { movieId } = await params;
    const supabase = createServerClient();
    const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

    if (!API_KEY) {
      return NextResponse.json(
        { error: 'TMDB API key is not configured' },
        { status: 500 }
      );
    }

    // 1. Get current stock data
    const { data: stock, error: stockError } = await supabase
      .from('movie_stocks')
      .select('*')
      .eq('id', movieId)
      .single();

    if (stockError || !stock) {
      return NextResponse.json(
        { error: 'Stock not found' },
        { status: 404 }
      );
    }

    // 2. Check if update is needed (lazy update strategy)
    const lastUpdated = new Date(stock.last_updated);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

    if (hoursSinceUpdate < UPDATE_THRESHOLD_HOURS) {
      // Data is fresh, no update needed
      return NextResponse.json({
        updated: false,
        message: 'Price is fresh, no update needed',
        stock,
      });
    }

    // 3. Stock needs update - fetch fresh TMDB data
    const tmdbId = stock.tmdb_id || movieId;
    const tmdbResponse = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
      params: {
        api_key: API_KEY,
      },
      timeout: 10000, // 10 second timeout
    });

    const tmdbData = tmdbResponse.data;

    // 4. Calculate indices
    const hypeIndex = calculateHypeIndexFromTMDB(tmdbData.popularity || 0);
    const boxOfficeIndex = await calculateBoxOfficeIndex(movieId);
    const womIndex = await calculateWOMIndex(movieId);

    // 5. Calculate new price
    const oldPrice = Number(stock.current_price);
    const newPrice = calculateNewPrice(oldPrice, hypeIndex, boxOfficeIndex, womIndex);
    const priceChange24h = calculatePriceChange24h(newPrice, oldPrice);

    // 6. Update database
    const { data: updatedStock, error: updateError } = await supabase
      .from('movie_stocks')
      .update({
        current_price: newPrice,
        price_change_24h: priceChange24h,
        hype_index: hypeIndex,
        box_office_index: boxOfficeIndex,
        wom_index: womIndex,
        last_updated: new Date().toISOString(),
      })
      .eq('id', movieId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // 7. Save history point (for charts)
    await supabase.from('market_history').insert({
      movie_id: movieId,
      price: newPrice,
    });

    return NextResponse.json({
      updated: true,
      message: 'Price updated successfully',
      stock: updatedStock,
      priceChange: {
        old: oldPrice,
        new: newPrice,
        change24h: priceChange24h,
      },
    });
  } catch (error: any) {
    console.error('Error updating stock price:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update stock price' },
      { status: 500 }
    );
  }
}


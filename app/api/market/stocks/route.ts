import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/market/stocks
 * Get all movie stocks (for market list page)
 * 
 * Query params:
 * - status: Filter by status (ACTIVE, UPCOMING, DELISTED)
 * - search: Search by title
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const supabase = createServerClient();

    let query = supabase.from('movie_stocks').select('*');

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    // Default: order by current_price descending
    query = query.order('current_price', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ stocks: data || [] });
  } catch (error: any) {
    console.error('Error fetching stocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stocks' },
      { status: 500 }
    );
  }
}


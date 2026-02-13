import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const UPDATE_THRESHOLD_HOURS = 1; // Update if last_updated is older than 1 hour

/**
 * GET /api/market/stocks/[movieId]
 * Get single stock details
 * Optionally triggers lazy update if data is stale (via ?update=true query param)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ movieId: string }> }
) {
  try {
    const { movieId } = await params;
    const { searchParams } = new URL(request.url);
    const shouldUpdate = searchParams.get('update') === 'true';

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('movie_stocks')
      .select('*')
      .eq('id', movieId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Stock not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Check if update is needed (lazy update strategy)
    if (shouldUpdate && data.last_updated) {
      const lastUpdated = new Date(data.last_updated);
      const now = new Date();
      const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

      if (hoursSinceUpdate >= UPDATE_THRESHOLD_HOURS) {
        // Trigger update in background (don't wait for it)
        // The frontend can call the update-price endpoint separately if needed
        // For now, we just return the current data
        // The stock detail page will handle calling the update API
      }
    }

    return NextResponse.json({ stock: data });
  } catch (error: any) {
    console.error('Error fetching stock:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock' },
      { status: 500 }
    );
  }
}


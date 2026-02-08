import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/market/stocks/[movieId]
 * Get single stock details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ movieId: string }> }
) {
  try {
    const { movieId } = await params;

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

    return NextResponse.json({ stock: data });
  } catch (error: any) {
    console.error('Error fetching stock:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock' },
      { status: 500 }
    );
  }
}


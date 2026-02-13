import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/creators/[id]
 * Fetch creator by ID (TMDB numeric ID) or slug from Supabase
 * Automatically detects if the id parameter is numeric (TMDB ID) or a slug
 * Returns 404 if not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`🔍 GET /api/creators/${id} - Searching Supabase...`);

    const supabase = createServerClient();

    // Check if id is numeric (TMDB ID) or a slug
    const isNumeric = /^\d+$/.test(id);
    
    let creator = null;
    
    if (isNumeric) {
      // Search by TMDB ID (id field)
      console.log(`   Searching by TMDB ID: ${id}`);
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.log(`❌ Creator not found by ID: ${id}`);
        return NextResponse.json(
          { error: 'Creator not found' },
          { status: 404 }
        );
      }

      creator = data;
    } else {
      // Search by slug
      console.log(`   Searching by slug: ${id}`);
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .eq('slug', id)
        .single();

      if (error || !data) {
        console.log(`❌ Creator not found by slug: ${id}`);
        return NextResponse.json(
          { error: 'Creator not found' },
          { status: 404 }
        );
      }

      creator = data;
    }

    console.log(`✅ Found creator: ${creator.name || 'Unknown'} (ID: ${creator.id})`);

    return NextResponse.json({ creator }, { status: 200 });
  } catch (error: any) {
    console.error(`❌ GET /api/creators/[id] - Error:`, error.message);
    return NextResponse.json(
      { error: 'Failed to fetch creator', details: error.message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/creators
 * Fetch all creators from Supabase
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📋 GET /api/creators - Fetching from Supabase...');

    const supabase = createServerClient();

    const { data: creators, error } = await supabase
      .from('creators')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    console.log(`✅ Found ${creators?.length || 0} creators in Supabase`);
    console.log('📤 Returning creators list');

    return NextResponse.json({ creators: creators || [] }, { status: 200 });
  } catch (error: any) {
    console.error('❌ GET /api/creators - Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch creators', details: error.message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * POST /api/market/prune-history
 * Prune market_history table by deleting records older than 7 days.
 * 
 * This endpoint should be called via Vercel Cron Jobs (free tier supports cron).
 * Recommended schedule: Daily at midnight UTC (0 0 * * *)
 * 
 * To set up in Vercel:
 * 1. Go to your project settings
 * 2. Navigate to "Cron Jobs"
 * 3. Add a new cron job:
 *    - Path: /api/market/prune-history
 *    - Schedule: 0 0 * * * (daily at midnight UTC)
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication/authorization check here
    // For example, check for a secret header to prevent unauthorized calls
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // Call the database function to prune history
    const { data, error } = await supabase.rpc('prune_market_history');

    if (error) {
      throw error;
    }

    // Get count of remaining records for reporting
    const { count } = await supabase
      .from('market_history')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      message: 'Market history pruned successfully',
      remainingRecords: count || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error pruning market history:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to prune market history' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/market/prune-history
 * Get statistics about market_history table (for monitoring)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Get total count
    const { count: totalCount } = await supabase
      .from('market_history')
      .select('*', { count: 'exact', head: true });

    // Get count of records older than 7 days (would be pruned)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { count: oldCount } = await supabase
      .from('market_history')
      .select('*', { count: 'exact', head: true })
      .lt('recorded_at', sevenDaysAgo.toISOString());

    // Get oldest and newest records
    const { data: oldest } = await supabase
      .from('market_history')
      .select('recorded_at')
      .order('recorded_at', { ascending: true })
      .limit(1)
      .single();

    const { data: newest } = await supabase
      .from('market_history')
      .select('recorded_at')
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      totalRecords: totalCount || 0,
      recordsToPrune: oldCount || 0,
      oldestRecord: oldest?.recorded_at || null,
      newestRecord: newest?.recorded_at || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error getting market history stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get market history stats' },
      { status: 500 }
    );
  }
}


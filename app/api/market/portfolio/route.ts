import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/market/api-helpers';
import { getUserMarketData } from '@/lib/market/portfolio-utils';

/**
 * GET /api/market/portfolio
 * Get user's portfolio with all holdings and market data
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { error: authError, user } = await requireAuth(request);
    if (authError) {
      return authError;
    }

    // 2. Get portfolio data
    const portfolioData = await getUserMarketData(user.uid);

    return NextResponse.json({
      success: true,
      ...portfolioData,
    });
  } catch (error: any) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: 500 }
    );
  }
}


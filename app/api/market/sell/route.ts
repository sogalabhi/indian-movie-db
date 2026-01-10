import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, validateBody, handleRpcError } from '@/lib/market/api-helpers';
import { createServerClient } from '@/lib/supabase/server';
import type { SellStockResponse } from '@/lib/market/types';

/**
 * POST /api/market/sell
 * Sell stock shares
 * 
 * Body: {
 *   movieId: string (TMDB ID as string)
 *   quantity: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { error: authError, user } = await requireAuth(request);
    if (authError) {
      return authError;
    }

    // 2. Validate request body
    const body = await request.json();
    const validation = validateBody(body, ['movieId', 'quantity']);
    if (!validation.valid) {
      return validation.error!;
    }

    const { movieId, quantity } = body;

    // 3. Validate quantity
    if (typeof quantity !== 'number' || quantity <= 0 || !Number.isInteger(quantity)) {
      return NextResponse.json(
        { error: 'Quantity must be a positive integer' },
        { status: 400 }
      );
    }

    // 4. Call Supabase RPC function
    // Using sell_stock_with_user which accepts user_id parameter
    // This works with Firebase Auth. Once Supabase Auth is set up,
    // you can switch to sell_stock() which uses auth.uid()
    
    const supabase = createServerClient();
    
    const { data, error } = await supabase.rpc('sell_stock_with_user', {
      target_user_id: user.uid,
      target_movie_id: String(movieId),
      qty: quantity,
    });

    if (error) {
      return handleRpcError(error);
    }

    const result = data as SellStockResponse;

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || 'Transaction failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      newBalance: result.new_balance,
      totalProceeds: result.total_proceeds,
      profitLoss: result.profit_loss,
      message: 'Stock sold successfully',
    });
  } catch (error: any) {
    console.error('Error in sell stock:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


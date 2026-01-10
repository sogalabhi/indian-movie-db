/**
 * Shared API utilities for market operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth/server';
import { createServerClient, createServiceClient } from '@/lib/supabase/server';
import type { BuyStockResponse, SellStockResponse } from './types';

/**
 * Get authenticated user or return 401 error
 */
export async function requireAuth(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  
  if (!user) {
    return {
      error: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
      user: null,
    };
  }
  
  return { error: null, user };
}

/**
 * Create Supabase client with user context for RPC calls
 * 
 * NOTE: The RPC functions use auth.uid(), which requires Supabase Auth session.
 * For now, we use service role client. In production, ensure Supabase Auth is set up
 * and users are synced between Firebase and Supabase.
 */
export function createAuthenticatedSupabaseClient(userId: string) {
  // For Phase 2: Use service role client
  // TODO: Once Supabase Auth is set up, create client with user session
  // This will allow auth.uid() to work in RPC functions
  return createServiceClient();
}

/**
 * Validate request body has required fields
 */
export function validateBody<T extends Record<string, any>>(
  body: any,
  requiredFields: (keyof T)[]
): { valid: boolean; error?: NextResponse } {
  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null) {
      return {
        valid: false,
        error: NextResponse.json(
          { error: `Missing required field: ${String(field)}` },
          { status: 400 }
        ),
      };
    }
  }
  return { valid: true };
}

/**
 * Handle Supabase RPC errors
 */
export function handleRpcError(error: any): NextResponse {
  console.error('RPC Error:', error);
  
  // Check if it's a known error from our RPC functions
  if (error?.message) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
  
  return NextResponse.json(
    { error: 'Transaction failed. Please try again.' },
    { status: 500 }
  );
}


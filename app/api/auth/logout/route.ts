import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/logout
 * Sign out from Supabase (client-side handles the actual logout)
 */
export async function POST() {
  try {
    const supabase = createServerClient();
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

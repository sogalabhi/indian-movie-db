import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/login
 * Supabase handles login client-side, this endpoint is for compatibility
 * The actual login happens in AuthContext via supabase.auth.signInWithPassword
 */
export async function POST(request: NextRequest) {
  try {
    // Supabase handles login client-side, so this endpoint mainly verifies the session
    const supabase = createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url, email')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      user: {
        uid: user.id,
        email: user.email || profile?.email || null,
        displayName: profile?.username || user.user_metadata?.username || null,
        photoURL: profile?.avatar_url || user.user_metadata?.avatar_url || null,
        emailVerified: user.email_confirmed_at !== null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

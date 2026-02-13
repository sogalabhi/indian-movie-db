import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserFromRequest } from '@/lib/auth/server';

/**
 * POST /api/auth/init-user
 * Initialize user profile and market_user if they don't exist
 * This is a fallback in case triggers don't fire
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // 1. Ensure profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.uid)
      .single();

    if (!existingProfile) {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.uid,
          username: user.displayName || user.email?.split('@')[0] || 'Anonymous',
          avatar_url: user.photoURL || null,
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        // Don't fail if profile creation fails, continue with market_user
      }
    }

    // 2. Ensure market_user exists with initial balance
    const { data: existingMarketUser } = await supabase
      .from('market_users')
      .select('id')
      .eq('id', user.uid)
      .single();

    if (!existingMarketUser) {
      // Create market_user with initial balance
      const { error: marketUserError } = await supabase
        .from('market_users')
        .insert({
          id: user.uid,
          username: user.displayName || user.email?.split('@')[0] || 'Anonymous',
          avatar_url: user.photoURL || null,
          coins: 20000,
          net_worth: 20000,
        });

      if (marketUserError) {
        console.error('Error creating market_user:', marketUserError);
        return NextResponse.json(
          { error: 'Failed to initialize market user', details: marketUserError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'User initialized successfully' 
    });
  } catch (error: any) {
    console.error('Error initializing user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


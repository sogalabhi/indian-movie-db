/**
 * Server-side authentication helpers
 * Uses Supabase Auth for session management
 */

import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

/**
 * Get current user from Supabase session
 * Use this in Server Components and Server Actions
 */
export async function getCurrentUser() {
  try {
    const supabase = createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }
    
    // Get profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url, email')
      .eq('id', user.id)
      .single();
    
    return {
      uid: user.id,
      email: user.email || profile?.email || null,
      displayName: profile?.username || user.user_metadata?.username || null,
      photoURL: profile?.avatar_url || user.user_metadata?.avatar_url || null,
      emailVerified: user.email_confirmed_at !== null,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Get current user from Request object (for API routes)
 * Use this in API route handlers
 */
export async function getCurrentUserFromRequest(request: Request) {
  try {
    // Extract authorization header or cookie
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');
    
    const supabase = createServerClient();
    
    // If authorization header exists, use it
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return null;
      }
      
      return {
        uid: user.id,
        email: user.email || null,
        displayName: user.user_metadata?.username || null,
        photoURL: user.user_metadata?.avatar_url || null,
        emailVerified: user.email_confirmed_at !== null,
      };
    }
    
    // Otherwise, try to get user from session (cookies handled by Supabase client)
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }
    
    // Get profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url, email')
      .eq('id', user.id)
      .single();
    
    return {
      uid: user.id,
      email: user.email || profile?.email || null,
      displayName: profile?.username || user.user_metadata?.username || null,
      photoURL: profile?.avatar_url || user.user_metadata?.avatar_url || null,
      emailVerified: user.email_confirmed_at !== null,
    };
  } catch (error) {
    console.error('Error getting current user from request:', error);
    return null;
  }
}

/**
 * Verify Supabase session and return user
 * Legacy function name for compatibility
 */
export async function verifySessionCookie(sessionCookie: string) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser(sessionCookie);
    
    if (error || !user) {
      return null;
    }
    
    return {
      uid: user.id,
      email: user.email,
      email_verified: user.email_confirmed_at !== null,
    };
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    return null;
  }
}

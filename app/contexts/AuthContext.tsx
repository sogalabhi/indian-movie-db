'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: SupabaseUser | null; // Keep for compatibility, but it's actually Supabase user now
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Sync Supabase auth state with server
   */
  const syncAuthWithServer = useCallback(async (supabaseUser: SupabaseUser | null) => {
    try {
      if (supabaseUser) {
        // Get user profile from Supabase
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url, email')
          .eq('id', supabaseUser.id)
          .single();

        const userData: User = {
          uid: supabaseUser.id,
          email: supabaseUser.email || profile?.email || null,
          displayName: profile?.username || supabaseUser.user_metadata?.username || null,
          photoURL: profile?.avatar_url || supabaseUser.user_metadata?.avatar_url || null,
          emailVerified: supabaseUser.email_confirmed_at !== null,
        };

        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error syncing auth with server:', error);
      setUser(null);
    }
  }, []);

  /**
   * Check server-side session on mount
   */
  const checkServerSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/verify');
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error checking server session:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Listen to Supabase auth state changes
   */
  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setFirebaseUser(session.user);
        syncAuthWithServer(session.user);
      }
      setLoading(false);
    });

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setFirebaseUser(session.user);
        await syncAuthWithServer(session.user);
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    // Also check server session on mount
    checkServerSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [syncAuthWithServer, checkServerSession]);

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        setFirebaseUser(data.user);
        await syncAuthWithServer(data.user);
      }
    } catch (error: any) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [syncAuthWithServer]);

  /**
   * Sign up with email and password
   */
  const signUp = useCallback(async (email: string, password: string, username?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username || email.split('@')[0],
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        setFirebaseUser(data.user);
        await syncAuthWithServer(data.user);
        
        // Ensure user is initialized in profiles and market_users tables
        // This is a fallback in case triggers don't fire
        try {
          await fetch('/api/auth/init-user', {
            method: 'POST',
          });
        } catch (err) {
          console.warn('Failed to initialize user:', err);
          // Don't block signup if initialization fails
        }
      }
    } catch (error: any) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [syncAuthWithServer]);

  /**
   * Sign out
   */
  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setFirebaseUser(null);

      // Clear server session
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh user data from server
   */
  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/verify');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }, []);

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

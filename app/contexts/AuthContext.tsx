'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { authClient } from '@/lib/firebase/client';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Sync Firebase auth state with server cookie
   */
  const syncAuthWithServer = useCallback(async (firebaseUser: FirebaseUser | null) => {
    try {
      if (firebaseUser) {
        // Get ID token and send to server to set cookie
        const idToken = await firebaseUser.getIdToken();
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Failed to sync auth with server:', response.status, errorData);
          setUser(null);
        }
      } else {
        // Clear cookie on server
        await fetch('/api/auth/logout', {
          method: 'POST',
        });
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
          // If we have a server session but no Firebase user, try to get it
          const currentFirebaseUser = authClient.getCurrentUser();
          if (!currentFirebaseUser) {
            // Server has session but client doesn't - this shouldn't happen normally
            // but we'll handle it gracefully
            console.warn('Server session exists but no Firebase user');
          }
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
   * Listen to Firebase auth state changes
   */
  useEffect(() => {
    const unsubscribe = authClient.onAuthStateChanged(async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        // Sync with server when Firebase user is available
        await syncAuthWithServer(firebaseUser);
      } else {
        // Clear user state when Firebase user is null
        setUser(null);
        await syncAuthWithServer(null);
      }
      
      setLoading(false);
    });

    // Also check server session on mount
    checkServerSession();

    return () => unsubscribe();
  }, [syncAuthWithServer, checkServerSession]);

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { user: firebaseUser } = await authClient.signIn(email, password);
      // Auth state listener will handle the rest
      setFirebaseUser(firebaseUser);
    } catch (error: any) {
      setLoading(false);
      throw error;
    }
  }, []);

  /**
   * Sign up with email and password
   */
  const signUp = useCallback(async (email: string, password: string, username?: string) => {
    setLoading(true);
    try {
      const { user: firebaseUser } = await authClient.signUp(email, password);
      
      // Update profile if username provided
      if (username) {
        await authClient.updateProfile(firebaseUser, { displayName: username });
      }
      
      // Auth state listener will handle the rest
      setFirebaseUser(firebaseUser);
    } catch (error: any) {
      setLoading(false);
      throw error;
    }
  }, []);

  /**
   * Sign out
   */
  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      // Sign out from Firebase (this will trigger auth state listener)
      await authClient.signOut();
      // Clear server session
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      setUser(null);
      setFirebaseUser(null);
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


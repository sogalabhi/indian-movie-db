/**
 * Server-side authentication helpers
 * Uses Firebase Admin to verify tokens and session cookies
 */

import { adminAuth } from '@/lib/firebase/server';
import { getAuthCookie } from './cookies';
import { cookies } from 'next/headers';

/**
 * Verify Firebase ID token and return decoded token
 */
export async function verifyIdToken(idToken: string) {
  try {
    if (!adminAuth) {
      console.error('Firebase Admin Auth is not initialized. Check your environment variables.');
      return null;
    }
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error: any) {
    console.error('Error verifying ID token:', error?.message || error);
    if (error?.code === 'app/invalid-credential') {
      console.error('Firebase Admin credentials are invalid. Please check your FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, and FIREBASE_PROJECT_ID.');
    }
    return null;
  }
}

/**
 * Create a session cookie from ID token
 * Session cookies are more secure and can be verified server-side
 */
export async function createSessionCookie(idToken: string) {
  try {
    if (!adminAuth) {
      console.error('Firebase Admin Auth is not initialized. Check your environment variables.');
      return null;
    }
    // Create session cookie that expires in 7 days
    const expiresIn = 60 * 60 * 24 * 7 * 1000; // 7 days in milliseconds
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    return sessionCookie;
  } catch (error: any) {
    console.error('Error creating session cookie:', error?.message || error);
    if (error?.code === 'app/invalid-credential') {
      console.error('Firebase Admin credentials are invalid. Please check your environment variables.');
    }
    return null;
  }
}

/**
 * Verify session cookie and return decoded token
 */
export async function verifySessionCookie(sessionCookie: string) {
  try {
    if (!adminAuth) {
      console.error('Firebase Admin Auth is not initialized. Check your environment variables.');
      return null;
    }
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedClaims;
  } catch (error: any) {
    console.error('Error verifying session cookie:', error?.message || error);
    return null;
  }
}

/**
 * Get current user from request (using Next.js cookies)
 * Use this in Server Components and Server Actions
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('auth-token')?.value;
    
    if (!sessionCookie) {
      return null;
    }

    const decodedClaims = await verifySessionCookie(sessionCookie);
    if (!decodedClaims) {
      return null;
    }

    if (!adminAuth) {
      console.error('Firebase Admin Auth is not initialized. Check your environment variables.');
      return null;
    }

    // Get user record for additional info
    const userRecord = await adminAuth.getUser(decodedClaims.uid);
    
    return {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      emailVerified: userRecord.emailVerified,
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
    const sessionCookie = getAuthCookie(request);
    
    if (!sessionCookie) {
      return null;
    }

    const decodedClaims = await verifySessionCookie(sessionCookie);
    if (!decodedClaims) {
      return null;
    }

    if (!adminAuth) {
      console.error('Firebase Admin Auth is not initialized. Check your environment variables.');
      return null;
    }

    // Get user record for additional info
    const userRecord = await adminAuth.getUser(decodedClaims.uid);
    
    return {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      emailVerified: userRecord.emailVerified,
    };
  } catch (error) {
    console.error('Error getting current user from request:', error);
    return null;
  }
}


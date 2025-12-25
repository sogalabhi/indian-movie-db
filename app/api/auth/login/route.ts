import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, createSessionCookie } from '@/lib/auth/server';

const AUTH_COOKIE_NAME = 'auth-token';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * POST /api/auth/login
 * Exchange Firebase ID token for session cookie
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken } = body;

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Verify the ID token
    const decodedToken = await verifyIdToken(idToken);
    if (!decodedToken) {
      return NextResponse.json(
        { error: 'Invalid ID token' },
        { status: 401 }
      );
    }

    // Create session cookie
    const sessionCookie = await createSessionCookie(idToken);
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    // Create response with user data
    const response = NextResponse.json({
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name,
        photoURL: decodedToken.picture,
        emailVerified: decodedToken.email_verified,
      },
    });

    // Set the session cookie using NextResponse
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: sessionCookie,
      maxAge: COOKIE_MAX_AGE,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: IS_PRODUCTION,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


import { NextResponse } from 'next/server';

const AUTH_COOKIE_NAME = 'auth-token';

/**
 * POST /api/auth/logout
 * Clear authentication cookie
 */
export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    
    // Clear the auth cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: '',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


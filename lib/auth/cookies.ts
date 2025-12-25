/**
 * Cookie utilities for authentication
 * Handles setting, getting, and clearing auth cookies
 */

const AUTH_COOKIE_NAME = 'auth-token';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Set authentication cookie in response
 */
export function setAuthCookie(token: string, response: Response): void {
  const cookieOptions = [
    `${AUTH_COOKIE_NAME}=${token}`,
    `Max-Age=${COOKIE_MAX_AGE}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    ...(IS_PRODUCTION ? ['Secure'] : []), // Only use Secure in production
  ].join('; ');

  response.headers.set('Set-Cookie', cookieOptions);
}

/**
 * Get authentication cookie from request
 */
export function getAuthCookie(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return cookies[AUTH_COOKIE_NAME] || null;
}

/**
 * Clear authentication cookie
 */
export function clearAuthCookie(response: Response): void {
  const cookieOptions = [
    `${AUTH_COOKIE_NAME}=`,
    'Max-Age=0',
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    ...(IS_PRODUCTION ? ['Secure'] : []),
  ].join('; ');

  response.headers.set('Set-Cookie', cookieOptions);
}


import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Site Mode & Security Middleware
 *
 * 1. Adds security headers to all responses
 * 2. Checks site mode and redirects non-admin users:
 *    - MAINTENANCE → /maintenance
 *    - COMING_SOON → /coming-soon
 *    - LIVE → normal access
 *
 * Admins (with admin_token cookie) always have full access.
 */

/**
 * Security headers to add to all responses
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent browsers from MIME-sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');

  // XSS Protection (legacy, but still useful for older browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // DNS prefetch control
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  // Permissions Policy (formerly Feature-Policy)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // HSTS - enforce HTTPS (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}

// Paths that should always be accessible (no redirect)
const PUBLIC_PATHS = [
  '/coming-soon',
  '/maintenance',
  '/admin',
  '/admin/login',
  '/api',
  '/_next',
  '/favicon.ico',
  '/images',
  '/fonts',
];

// Check if path should skip middleware
function shouldSkip(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname.startsWith(path));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip site mode checks for public paths (but still add security headers)
  if (shouldSkip(pathname)) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Check for admin token (admins bypass all restrictions)
  const adminToken = request.cookies.get('admin_token');
  if (adminToken?.value) {
    return addSecurityHeaders(NextResponse.next());
  }

  try {
    // Fetch site mode from API
    const baseUrl = request.nextUrl.origin;
    const response = await fetch(`${baseUrl}/api/site-mode`, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      // On error, allow access
      return addSecurityHeaders(NextResponse.next());
    }

    const data = await response.json();

    // Redirect based on mode
    if (data.mode === 'MAINTENANCE') {
      return addSecurityHeaders(NextResponse.redirect(new URL('/maintenance', request.url)));
    }

    if (data.mode === 'COMING_SOON') {
      return addSecurityHeaders(NextResponse.redirect(new URL('/coming-soon', request.url)));
    }

    // LIVE mode - allow access
    return addSecurityHeaders(NextResponse.next());
  } catch (error) {
    // On error, allow access (don't block the site)
    console.error('Middleware error:', error);
    return addSecurityHeaders(NextResponse.next());
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|fonts).*)',
  ],
};

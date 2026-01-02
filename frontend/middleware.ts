import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Pages that don't require authentication
const PUBLIC_PATHS = ['/unlock', '/api/', '/_next', '/favicon.ico', '/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check for access cookie
  const hasAccess = request.cookies.get('site_access')?.value === 'granted';

  if (!hasAccess) {
    // Redirect to unlock page
    const url = request.nextUrl.clone();
    url.pathname = '/unlock';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

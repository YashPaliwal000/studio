
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const AUTH_COOKIE_NAME = 'authToken';

// Define public and protected paths
const PUBLIC_PATHS = ['/login'];
const PROTECTED_ROOT = '/'; // Dashboard or main app page after login

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  // Allow requests to Next.js internals, public assets, and API routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/static/') || // if you have a /static folder in /public
    pathname.includes('.') // Generally allows files like favicon.ico, images
  ) {
    return NextResponse.next();
  }

  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  if (authToken === 'valid_admin_token') {
    // If logged in and trying to access a public path (like /login), redirect to dashboard
    if (isPublicPath) {
      return NextResponse.redirect(new URL(PROTECTED_ROOT, request.url));
    }
  } else {
    // If not logged in and trying to access a protected path, redirect to login
    if (!isPublicPath) {
      let from = pathname;
      if (request.nextUrl.search) {
        from += request.nextUrl.search;
      }
      const loginUrl = new URL('/login', request.url);
      // loginUrl.searchParams.set('from', from); // Optional: redirect back after login
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes) - explicitly handled above but good to keep pattern
     * Any other files in /public (e.g., images, manifests) are usually handled by checking for '.'
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};


import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const AUTH_COOKIE_NAME = 'authToken';

// Public page paths/prefixes that do not require authentication.
// The middleware will allow access to these paths even if the user is not logged in.
const PUBLIC_PATH_PREFIXES = [
  '/login',
  '/guest-invoice', // Allows /guest-invoice/ and /guest-invoice/[id]
  // Add other public page prefixes here if they don't contain a '.'
];

const PROTECTED_ROOT = '/'; // Dashboard or main app page after login

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  // 1. Allow Next.js internal paths and public static files first.
  // The `config.matcher` below already excludes common static assets like
  // _next/static, _next/image, and favicon.ico.
  // pathname.includes('.') is a general rule for other files in /public (e.g., images, manifests).
  // pathname.startsWith('/_next/') catches other Next.js specific paths like /_next/data/.
  if (pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // 2. Check if the current path starts with any of the defined public prefixes.
  const isExplicitlyPublicPath = PUBLIC_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix));

  const isLoggedIn = authToken === 'valid_admin_token';

  if (isLoggedIn) {
    // User is logged in.
    // If they try to access the login page, redirect them to the protected root (dashboard).
    if (pathname === '/login') {
      return NextResponse.redirect(new URL(PROTECTED_ROOT, request.url));
    }
    // For any other path (public or protected), allow access since they are logged in.
    return NextResponse.next();
  } else {
    // User is NOT logged in.
    if (isExplicitlyPublicPath) {
      // If the path is explicitly public (like /login or /guest-invoice/[id]), allow access.
      return NextResponse.next();
    } else {
      // If the path is not explicitly public, it's considered protected.
      // Redirect to the login page.
      const loginUrl = new URL('/login', request.url);
      // Optional: to redirect back to the original page after login
      // loginUrl.searchParams.set('from', pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes are not intended to be handled by this auth middleware)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file - though pathname.includes('.') would also catch it)
     *
     * This matcher configuration focuses the middleware on page navigations
     * rather than static assets or API calls.
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

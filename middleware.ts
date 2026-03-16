import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and specific pages
  const skipPaths = [
    '/_next/',
    '/favicon.ico',
    '/public/'
  ];

  if (skipPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Explicitly allow all Auth API requests to pass through
  // This ensures signOut() and getSession() work even if the user is banned
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  try {
    // Get user token (edge-compatible)
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    // Check if the path is admin route
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // For edge runtime, we'll do basic role checking from token
      // Admin routes require admin or super-admin role
      const userRole = token.role || token.type;
      const isAdmin = userRole === 'admin' || userRole === 'super-admin';

      if (!isAdmin) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }

      // For API routes, add user info to headers
      if (pathname.startsWith('/api/admin')) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', token.sub || '');
        requestHeaders.set('x-user-role', userRole || '');
        requestHeaders.set('x-user-email', token.email || '');

        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      }

      // For admin pages, continue to ban check
    }

    // Auth routes
    const authRoutes = ['/login', '/signup'];
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

    // Redirect to home if already authenticated and trying to access auth pages
    if (isAuthRoute && token) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // If no token, continue to auth check for protected routes
    if (!token?.sub) {
      // Protected routes (non-admin)
      const protectedRoutes = ['/profile', '/dashboard'];
      const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

      // Public profile pages - allow access without authentication
      const isPublicProfile = pathname.startsWith('/profile/') && pathname.split('/').length === 3;

      // Only protect main profile page, not public profile pages
      const isMainProfilePage = pathname === '/profile' || (pathname.startsWith('/profile/') && pathname.split('/').length === 2);

      // Redirect to login if trying to access protected route without auth
      if (isProtectedRoute && !isPublicProfile) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }

      return NextResponse.next();
    }

    // Skip ban check for banned page itself and auth pages
    if (pathname === '/banned' || authRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next();
    }

    // Check if user is banned (using token-based check for edge compatibility)
    // For edge runtime, we'll check ban status from token if available
    const banStatus = (token.banStatus as string) || 'NONE';

    // PROPER_BAN: Strictly redirect to /banned/proper
    if (banStatus === 'PROPER_BAN' || banStatus === 'PROPER_BANNED') {
      if (pathname !== '/banned/proper') {
        const bannedUrl = new URL('/banned/proper', request.url);
        return NextResponse.redirect(bannedUrl);
      }
    }

    // SOFT_BAN: Strictly redirect to /suspended
    if (banStatus === 'SOFT_BAN' || banStatus === 'SOFT_BANNED') {
      if (pathname !== '/suspended') {
        const suspendedUrl = new URL('/suspended', request.url);
        return NextResponse.redirect(suspendedUrl);
      }
    }

    return NextResponse.next();

  } catch (error) {
    console.error('Middleware error:', error);
    // For admin routes, redirect to login on error
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // For other routes, continue normally on error to avoid breaking the app
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

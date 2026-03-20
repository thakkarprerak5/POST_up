import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Static assets – always skip ─────────────────────────────────────────────
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/apple-icon') ||
    pathname.startsWith('/uploads/') ||
    pathname.startsWith('/public/')
  ) {
    return NextResponse.next();
  }

  // ── Always allow NextAuth API routes ────────────────────────────────────────
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // ── Public routes whitelist (accessible without login) ──────────────────────
  const publicRoutes = [
    '/login',
    '/signup',
    '/banned',
    '/suspended',
    '/unauthorized',
  ];

  // Public API routes (accessible without login)
  const publicApiPrefixes = [
    '/api/public',
  ];

  const isPublicRoute =
    publicRoutes.some((route) => pathname === route || pathname.startsWith(route + '/')) ||
    publicApiPrefixes.some((prefix) => pathname.startsWith(prefix));

  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // ── Unauthenticated user ─────────────────────────────────────────────────
    if (!token?.sub) {
      // Allow access to explicitly public routes
      if (isPublicRoute) {
        return NextResponse.next();
      }

      // For API routes: return 401 JSON (not an HTML redirect — that breaks fetch/JSON.parse)
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // For page routes: redirect to /login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // ── Authenticated user ───────────────────────────────────────────────────

    // Redirect away from auth pages if already logged in
    if (pathname === '/login' || pathname === '/signup') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Skip further checks for banned/suspended pages
    if (pathname === '/banned' || pathname.startsWith('/banned/') || pathname === '/suspended') {
      return NextResponse.next();
    }

    // ── Ban enforcement ──────────────────────────────────────────────────────
    const banStatus = (token.banStatus as string) || 'ACTIVE';

    if (banStatus === 'PROPER_BAN' || banStatus === 'PROPER_BANNED') {
      if (!pathname.startsWith('/banned')) {
        return NextResponse.redirect(new URL('/banned/proper', request.url));
      }
    }

    if (banStatus === 'SOFT_BAN' || banStatus === 'SOFT_BANNED') {
      if (pathname !== '/suspended') {
        return NextResponse.redirect(new URL('/suspended', request.url));
      }
    }

    // ── Admin route protection ───────────────────────────────────────────────
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      const userRole = (token.role as string) || (token.type as string);
      const isAdmin = userRole === 'admin' || userRole === 'super-admin';

      if (!isAdmin) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }

      // Inject user info headers for admin API routes
      if (pathname.startsWith('/api/admin')) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', token.sub || '');
        requestHeaders.set('x-user-role', userRole || '');
        requestHeaders.set('x-user-email', (token.email as string) || '');

        return NextResponse.next({
          request: { headers: requestHeaders },
        });
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // On error, allow public routes through
    if (isPublicRoute) {
      return NextResponse.next();
    }
    // API routes → JSON 401 so fetch() callers don't get HTML
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
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

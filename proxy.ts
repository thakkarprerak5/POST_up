// proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export default async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = request.nextUrl;

  // Check if the path is admin route
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    try {
      if (!token) {
        // Redirect to login if not authenticated
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Connect to database
      await connectDB();

      // Get user from database to verify role
      const user = await User.findById(token.id);
      
      if (!user) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Check if user has admin or super_admin role
      if (user.type !== 'admin' && user.type !== 'super_admin') {
        // Redirect non-admin users to home page
        return NextResponse.redirect(new URL('/', request.url));
      }

      // Check if user is blocked or inactive
      if (user.isBlocked || !user.isActive) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // For API routes, add user info to headers
      if (pathname.startsWith('/api/admin')) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', user._id.toString());
        requestHeaders.set('x-user-role', user.type);
        requestHeaders.set('x-user-email', user.email);

        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      }

      // For admin pages, proceed normally
      return NextResponse.next();
    } catch (error) {
      console.error('Admin middleware error:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Protected routes (non-admin)
  const protectedRoutes = ['/profile', '/dashboard'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  // Public profile pages - allow access without authentication
  const isPublicProfile = pathname.startsWith('/profile/') && pathname.split('/').length === 3;
  
  // Only protect the main profile page, not public profile pages
  const isMainProfilePage = pathname === '/profile' || (pathname.startsWith('/profile/') && pathname.split('/').length === 2);

  // Auth routes
  const authRoutes = ['/login', '/signup'];
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // Redirect to login if trying to access protected route without auth
  if (isProtectedRoute && !token && !isPublicProfile) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to home if already authenticated and trying to access auth pages
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

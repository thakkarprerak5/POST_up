/**
 * MERGED: Enhanced Middleware for Admin Panel
 * Combines all history updates for complete admin route protection
 * 
 * Features:
 * - Protects all /admin/* routes
 * - Allows access for admin, super-admin, and mentor roles
 * - Checks both role and type fields for compatibility
 * - Proper error handling and redirects
 */

import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    const token = await getToken({ req: request as any });
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Enhanced role checking from history - supports both role and type fields
    const user = token as any;
    const isAdmin = user.type === 'admin' || user.type === 'super-admin' || 
                   user.type === 'mentor' ||
                   user.role === 'admin' || user.role === 'super-admin' ||
                   user.role === 'mentor';
    
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // Check if user is blocked or inactive (if available in token)
    if (user.isBlocked || user.isActive === false) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
};

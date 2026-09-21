import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const searchParams = request.nextUrl.searchParams;
  const hasRefCode = searchParams.has('ref');

  // Protected routes that require login
  const protectedRoutes = [
    '/dashboard',
    '/profile', 
    '/deposit',
    '/withdraw',
    '/spin',
    '/team',
    '/subscription',
    '/transactions',
  ];

  // Check if user has auth cookie
  const hasAuthCookie = request.cookies.has('dailypaisa_auth');

  // If accessing protected route without cookie, redirect to login
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!hasAuthCookie) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // ✅ FIX: If accessing login page WITH a referral code, allow access even if logged in
  // This allows users to register new accounts via referral links
  if (pathname === '/' && hasRefCode) {
    return NextResponse.next();
  }

  // If accessing login page WITHOUT referral code and has cookie, redirect to dashboard
  if (pathname === '/' && hasAuthCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Only run middleware on these paths
export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/deposit/:path*', '/withdraw/:path*', '/spin/:path*', '/team/:path*', '/subscription/:path*', '/transactions/:path*', '/'],
};

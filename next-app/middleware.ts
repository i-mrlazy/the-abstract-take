import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'abstract_session';

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  try {
    return atob(base64);
  } catch {
    return '';
  }
}

function isValidJwtStructure(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  try {
    const payloadStr = base64UrlDecode(parts[1]);
    if (!payloadStr) return false;
    const payload = JSON.parse(payloadStr);

    if (!payload.userId || !payload.role) return false;
    if (payload.role !== 'admin') return false;
    if (payload.exp && Date.now() >= payload.exp * 1000) return false;

    return true;
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Only protect /admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isAuthenticated = sessionCookie ? isValidJwtStructure(sessionCookie) : false;

  // If visiting login page
  if (pathname === '/admin/login') {
    if (isAuthenticated) {
      const nextParam = req.nextUrl.searchParams.get('next');
      const targetUrl = nextParam && nextParam.startsWith('/admin') ? nextParam : '/admin';
      return NextResponse.redirect(new URL(targetUrl, req.url));
    }
    return NextResponse.next();
  }

  // If visiting any other /admin/* page without authentication
  if (!isAuthenticated) {
    const loginUrl = new URL('/admin/login', req.url);
    const destination = pathname + search;
    if (destination !== '/admin') {
      loginUrl.searchParams.set('next', destination);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

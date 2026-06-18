import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/write', '/settings'];
const publicRoutes = ['/login', '/register'];
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function isTokenValid(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp) {
      const expirationTime = payload.exp * 1000;
      return Date.now() < expirationTime;
    }
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route));

  if (!isProtectedRoute && !isPublicRoute) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('jianshu_access_token')?.value;
  const refreshToken = request.cookies.get('jianshu_refresh_token')?.value;

  if (isPublicRoute) {
    if (accessToken && isTokenValid(accessToken)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (!accessToken && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (accessToken && !isTokenValid(accessToken) && refreshToken) {
    try {
      const refreshResponse = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshResponse.ok) {
        const { token, refreshToken: newRefreshToken } = await refreshResponse.json();

        const response = NextResponse.next();

        response.cookies.set('jianshu_access_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        });

        response.cookies.set('jianshu_refresh_token', newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30,
          path: '/',
        });

        return response;
      }
    } catch {
      // Refresh failed
    }
  }

  if (accessToken && !isTokenValid(accessToken) && !refreshToken) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('jianshu_access_token');
    response.cookies.delete('jianshu_refresh_token');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
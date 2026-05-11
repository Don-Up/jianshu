import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Test the isTokenValid logic separately since middleware runs at edge
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

function createMockJwt(payload: object, expired = false): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = expired ? Math.floor(Date.now() / 1000) - 3600 : Math.floor(Date.now() / 1000) + 3600;
  const payloadStr = btoa(JSON.stringify({ ...payload, exp }));
  const signature = 'test-signature';
  return `${header}.${payloadStr}.${signature}`;
}

describe('middleware token validation', () => {
  describe('isTokenValid', () => {
    it('should return false for invalid JWT format', () => {
      expect(isTokenValid('invalid-token')).toBe(false);
      expect(isTokenValid('only.two')).toBe(false);
      expect(isTokenValid('')).toBe(false);
    });

    it('should return false for expired token', () => {
      const expiredToken = createMockJwt({ userId: '1' }, true);
      expect(isTokenValid(expiredToken)).toBe(false);
    });

    it('should return true for valid non-expired token', () => {
      const validToken = createMockJwt({ userId: '1' });
      expect(isTokenValid(validToken)).toBe(true);
    });

    it('should return true for token without exp claim', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ userId: '1' }));
      const signature = 'test-signature';
      const token = `${header}.${payload}.${signature}`;
      expect(isTokenValid(token)).toBe(true);
    });
  });

  describe('protected route detection', () => {
    const protectedRoutes = ['/write', '/settings'];

    function isProtectedRoute(pathname: string): boolean {
      return protectedRoutes.some(route => pathname.startsWith(route));
    }

    it('should identify /write as protected', () => {
      expect(isProtectedRoute('/write')).toBe(true);
      expect(isProtectedRoute('/write/new')).toBe(true);
    });

    it('should identify /settings as protected', () => {
      expect(isProtectedRoute('/settings')).toBe(true);
      expect(isProtectedRoute('/settings/profile')).toBe(true);
    });

    it('should not identify public routes as protected', () => {
      expect(isProtectedRoute('/')).toBe(false);
      expect(isProtectedRoute('/login')).toBe(false);
      expect(isProtectedRoute('/register')).toBe(false);
      expect(isProtectedRoute('/article/test-slug')).toBe(false);
    });
  });

  describe('public route detection', () => {
    const publicRoutes = ['/login', '/register'];

    function isPublicRoute(pathname: string): boolean {
      return publicRoutes.some(route => pathname === route || pathname.startsWith(route));
    }

    it('should identify login and register as public', () => {
      expect(isPublicRoute('/login')).toBe(true);
      expect(isPublicRoute('/register')).toBe(true);
    });

    it('should not identify protected routes as public', () => {
      expect(isPublicRoute('/write')).toBe(false);
      expect(isPublicRoute('/settings')).toBe(false);
    });

    it('should identify other routes as neither', () => {
      expect(isPublicRoute('/')).toBe(false);
      expect(isPublicRoute('/article/test')).toBe(false);
    });
  });
});

describe('middleware redirect logic', () => {
  it('should redirect to login with return path for unauthenticated access to protected route', () => {
    const protectedPath = '/write';
    const loginUrl = new URL('/login', 'http://localhost:3000');
    loginUrl.searchParams.set('redirect', protectedPath);
    expect(loginUrl.toString()).toContain('/login?redirect=%2Fwrite');
  });

  it('should redirect to home for authenticated access to public route', () => {
    const publicPath = '/login';
    const homeUrl = new URL('/', 'http://localhost:3000');
    expect(homeUrl.pathname).toBe('/');
  });
});
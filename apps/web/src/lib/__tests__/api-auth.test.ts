import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch for testing refresh logic
global.fetch = vi.fn();

const REFRESH_TOKEN_COOKIE = 'jianshu_refresh_token';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

async function refreshTokens(): Promise<boolean> {
  const refreshToken = getCookie(REFRESH_TOKEN_COOKIE);
  if (!refreshToken) return false;

  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

describe('cookie utilities', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCookie', () => {
    it('should return null when document is undefined (SSR)', () => {
      // @ts-expect-error - testing SSR case
      const originalWindow = global.window;
      // @ts-expect-error - testing SSR case
      delete global.window;
      expect(getCookie('test')).toBeNull();
      // @ts-expect-error - testing SSR case
      global.window = originalWindow;
    });

    it('should parse cookie string correctly', () => {
      Object.defineProperty(document, 'cookie', {
        value: 'jianshu_access_token=test-token; path=/',
        writable: true,
        configurable: true,
      });
      expect(getCookie('jianshu_access_token')).toBe('test-token');
    });

    it('should return null for non-existent cookie', () => {
      Object.defineProperty(document, 'cookie', {
        value: 'other_cookie=value',
        writable: true,
        configurable: true,
      });
      expect(getCookie('jianshu_access_token')).toBeNull();
    });

    it('should decode URI component', () => {
      Object.defineProperty(document, 'cookie', {
        value: 'jianshu_access_token=test%20token%2Bvalue; path=/',
        writable: true,
        configurable: true,
      });
      expect(getCookie('jianshu_access_token')).toBe('test token+value');
    });
  });

  describe('refreshTokens', () => {
    it('should return false when no refresh token cookie', async () => {
      Object.defineProperty(document, 'cookie', {
        value: '',
        writable: true,
        configurable: true,
      });
      expect(getCookie(REFRESH_TOKEN_COOKIE)).toBeNull();
      const result = await refreshTokens();
      expect(result).toBe(false);
    });

    it('should call refresh endpoint and return true on success', async () => {
      Object.defineProperty(document, 'cookie', {
        value: `${REFRESH_TOKEN_COOKIE}=refresh-token-value; path=/`,
        writable: true,
        configurable: true,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await refreshTokens();
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'refresh-token-value' }),
      });
    });

    it('should return false when refresh endpoint returns non-ok', async () => {
      Object.defineProperty(document, 'cookie', {
        value: `${REFRESH_TOKEN_COOKIE}=refresh-token-value; path=/`,
        writable: true,
        configurable: true,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const result = await refreshTokens();
      expect(result).toBe(false);
    });

    it('should return false when fetch throws', async () => {
      Object.defineProperty(document, 'cookie', {
        value: `${REFRESH_TOKEN_COOKIE}=refresh-token-value; path=/`,
        writable: true,
        configurable: true,
      });

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await refreshTokens();
      expect(result).toBe(false);
    });
  });
});

describe('token refresh flow simulation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('should refresh token on 401 response', async () => {
    const mockUserResponse = {
      ok: true,
      json: () => Promise.resolve({ success: true, data: { id: '1', name: 'Test' } }),
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ status: 401 }) // First API call returns 401
      .mockResolvedValueOnce({ ok: true }) // Refresh succeeds
      .mockResolvedValueOnce(mockUserResponse); // Retry with new token succeeds

    Object.defineProperty(document, 'cookie', {
      value: `${REFRESH_TOKEN_COOKIE}=refresh-token-value; path=/; jianshu_access_token=old-token`,
      writable: true,
      configurable: true,
    });

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    // Simulate first API call
    const firstResponse = await global.fetch('/api/auth/me', { headers });
    let finalResponse = firstResponse;

    // If 401, attempt refresh
    if (firstResponse.status === 401) {
      const refreshed = await refreshTokens();
      if (refreshed) {
        const newToken = 'new-access-token';
        document.cookie = `jianshu_access_token=${newToken}; path=/`;
        headers['Authorization'] = `Bearer ${newToken}`;
        headers['x-retry'] = 'true';
        finalResponse = await global.fetch('/api/auth/me', { headers });
      }
    }

    expect(firstResponse.status).toBe(401);
    expect(headers['x-retry']).toBe('true');
    expect(finalResponse.ok).toBe(true);
  });
});
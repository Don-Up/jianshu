import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../use-auth';

// Mock fetch globally
global.fetch = vi.fn();

const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  username: 'testuser',
  createdAt: new Date(),
};

const wrapperComponent = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

// Helper to create mock fetch response
function createMockResponse(data: unknown, ok = true) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(data),
  };
}

describe('useAuth hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('initial state', () => {
    it('should start with null user when no token', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(createMockResponse({ success: false }));

      const { result } = renderHook(() => useAuth(), { wrapper: wrapperComponent });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    it('should update user state on successful login', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse({ success: true, data: { user: mockUser } })
      );

      const { result } = renderHook(() => useAuth(), { wrapper: wrapperComponent });

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should throw error on failed login', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse({ success: false, error: 'Invalid credentials' })
      );

      const { result } = renderHook(() => useAuth(), { wrapper: wrapperComponent });

      let error: Error | undefined;
      await act(async () => {
        try {
          await result.current.login('test@example.com', 'wrong');
        } catch (e) {
          error = e as Error;
        }
      });

      expect(error?.message).toBe('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should call logout API and clear auth state', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse({ success: true })
      );

      const { result } = renderHook(() => useAuth(), { wrapper: wrapperComponent });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
      expect(result.current.user).toBeNull();
    });
  });

  describe('register', () => {
    it('should update user state on successful registration', async () => {
      const newUser = { ...mockUser, id: '2', email: 'new@example.com', username: 'newuser' };

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse({ success: true, data: { user: newUser } })
      );

      const { result } = renderHook(() => useAuth(), { wrapper: wrapperComponent });

      await act(async () => {
        await result.current.register('new@example.com', 'password', 'New User', 'newuser');
      });

      expect(result.current.user).toEqual(newUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});
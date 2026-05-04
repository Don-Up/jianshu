import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../use-auth';

// Mock the auth API and utilities
vi.mock('@/lib/api', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    me: vi.fn(),
  },
}));

vi.mock('@/lib/auth', () => ({
  getToken: vi.fn(),
  getUser: vi.fn(),
  setUser: vi.fn(),
  setToken: vi.fn(),
  clearAuth: vi.fn(),
  isAuthenticated: vi.fn(),
}));

import { authApi } from '@/lib/api';
import { getUser, setUser, setToken, clearAuth, isAuthenticated } from '@/lib/auth';

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

describe('useAuth hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isAuthenticated).mockReturnValue(false);
  });

  describe('initial state', () => {
    it('should start with null user when no token', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: wrapperComponent });

      // Wait for initial load to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    it('should update user state on successful login', async () => {
      vi.mocked(authApi.login).mockResolvedValue({
        success: true,
        data: { token: 'token123', user: mockUser },
      });

      const { result } = renderHook(() => useAuth(), { wrapper: wrapperComponent });

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      expect(setToken).toHaveBeenCalledWith('token123');
      expect(setUser).toHaveBeenCalledWith(mockUser);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should throw error on failed login', async () => {
      vi.mocked(authApi.login).mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      const { result } = renderHook(() => useAuth(), { wrapper: wrapperComponent });

      await act(async () => {
        await expect(result.current.login('test@example.com', 'wrong')).rejects.toThrow('Invalid credentials');
      });
    });
  });

  describe('logout', () => {
    it('should clear auth and set user to null', async () => {
      // Setup logged in state
      vi.mocked(isAuthenticated).mockReturnValue(true);
      vi.mocked(getUser).mockReturnValue(mockUser);
      vi.mocked(authApi.me).mockResolvedValue({
        success: true,
        data: mockUser,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: wrapperComponent });

      // Wait for initial load
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Perform logout
      await act(async () => {
        result.current.logout();
      });

      expect(clearAuth).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('register', () => {
    it('should update user state on successful registration', async () => {
      const newUser = { ...mockUser, id: '2', email: 'new@example.com', username: 'newuser' };
      vi.mocked(authApi.register).mockResolvedValue({
        success: true,
        data: { token: 'newtoken', user: newUser },
      });

      const { result } = renderHook(() => useAuth(), { wrapper: wrapperComponent });

      await act(async () => {
        await result.current.register('new@example.com', 'password', 'New User', 'newuser');
      });

      expect(setToken).toHaveBeenCalledWith('newtoken');
      expect(setUser).toHaveBeenCalledWith(newUser);
      expect(result.current.user).toEqual(newUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});

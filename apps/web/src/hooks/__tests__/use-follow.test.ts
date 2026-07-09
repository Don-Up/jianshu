import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFollow } from '../use-follow';

// Mock API
const mockFollow = vi.fn();
vi.mock('@/lib/api', () => ({
  userApi: {
    follow: (...args: unknown[]) => mockFollow(...args),
  },
}));

// Mock query-keys
vi.mock('@/lib/query-keys', () => ({
  queryKeys: {
    user: (username: string) => ['user', username],
  },
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe('useFollow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial state', () => {
    it('should return initial isFollowing as false', () => {
      const { result } = renderHook(() => useFollow('user-1', 'john', false), {
        wrapper: Wrapper,
      });
      expect(result.current.isFollowing).toBe(false);
    });

    it('should return initial isFollowing as true', () => {
      const { result } = renderHook(() => useFollow('user-1', 'john', true), {
        wrapper: Wrapper,
      });
      expect(result.current.isFollowing).toBe(true);
    });

    it('should return isPending as false initially', () => {
      const { result } = renderHook(() => useFollow('user-1', 'john', false), {
        wrapper: Wrapper,
      });
      expect(result.current.isPending).toBe(false);
    });
  });

  describe('Follow/Unfollow', () => {
    it('should toggle follow state when toggleFollow is called', async () => {
      mockFollow.mockResolvedValue({ success: true, data: { isFollowing: true } });

      const { result } = renderHook(() => useFollow('user-1', 'john', false), {
        wrapper: Wrapper,
      });

      expect(result.current.isFollowing).toBe(false);

      result.current.toggleFollow();

      await waitFor(() => {
        expect(result.current.isFollowing).toBe(true);
      });
    });

    it('should set isPending to true during mutation', async () => {
      mockFollow.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ success: true, data: { isFollowing: true } }), 100)));

      const { result } = renderHook(() => useFollow('user-1', 'john', false), {
        wrapper: Wrapper,
      });

      result.current.toggleFollow();

      expect(result.current.isPending).toBe(true);

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });
    });

    it('should call userApi.follow with correct userId', async () => {
      mockFollow.mockResolvedValue({ success: true, data: { isFollowing: true } });

      const { result } = renderHook(() => useFollow('user-123', 'john', false), {
        wrapper: Wrapper,
      });

      result.current.follow();

      await waitFor(() => {
        expect(mockFollow).toHaveBeenCalledWith('user-123');
      });
    });
  });

  describe('Optimistic update', () => {
    it('should update isFollowing immediately on toggleFollow', async () => {
      mockFollow.mockResolvedValue({ success: true, data: { isFollowing: true } });

      const { result } = renderHook(() => useFollow('user-1', 'john', false), {
        wrapper: Wrapper,
      });

      // Initial state
      expect(result.current.isFollowing).toBe(false);

      // Optimistic update should happen immediately
      result.current.toggleFollow();

      // UI should update right away (before API response)
      expect(result.current.isFollowing).toBe(true);
    });
  });

  describe('Error rollback', () => {
    it('should rollback to previous state on error', async () => {
      mockFollow.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useFollow('user-1', 'john', false), {
        wrapper: Wrapper,
      });

      expect(result.current.isFollowing).toBe(false);

      result.current.toggleFollow();

      await waitFor(() => {
        // Should rollback to false after error
        expect(result.current.isFollowing).toBe(false);
      });
    });
  });
});

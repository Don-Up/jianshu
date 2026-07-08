import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react';
import { useArticleVersions } from '../use-article-versions';

// Mock fetch globally
global.fetch = vi.fn();

// Helper to create mock fetch response
function createMockResponse(data: unknown, ok = true) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(data),
  };
}

// Mock version data
const mockVersion = {
  id: 'version-123',
  title: 'Previous Title',
  content: 'Previous content',
  excerpt: 'Previous excerpt',
  version: 1,
  createdAt: '2024-01-01T00:00:00Z',
};

const mockVersion2 = {
  id: 'version-124',
  title: 'Current Title',
  content: 'Current content',
  excerpt: 'Current excerpt',
  version: 2,
  createdAt: '2024-01-02T00:00:00Z',
};

// Helper to create wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useArticleVersions hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('initial state', () => {
    it('should start with empty versions when slug is empty', () => {
      const { result } = renderHook(() => useArticleVersions(''), {
        wrapper: createWrapper(),
      });
      expect(result.current.versions).toEqual([]);
    });

    it('should start with isLoading false when disabled', () => {
      const { result } = renderHook(() => useArticleVersions(''), {
        wrapper: createWrapper(),
      });
      expect(result.current.isLoading).toBe(false);
    });

    it('should start with no error', () => {
      const { result } = renderHook(() => useArticleVersions(''), {
        wrapper: createWrapper(),
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe('load versions by slug', () => {
    it('should load versions successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse({ success: true, data: [mockVersion2, mockVersion] })
      );

      const { result } = renderHook(() => useArticleVersions('test-article'), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(result.current.versions).toHaveLength(2);
      expect(result.current.versions[0].id).toBe('version-124');
      expect(result.current.versions[0].version).toBe(2);
    });

    it('should set error when API fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

      const { result } = renderHook(() => useArticleVersions('test-article'), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(result.current.error).toBe('Failed to fetch');
    });

    it('should return empty array when no versions exist', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse({ success: true, data: [] })
      );

      const { result } = renderHook(() => useArticleVersions('test-article'), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(result.current.versions).toHaveLength(0);
    });
  });

  describe('restoreVersion mutation', () => {
    it('should have restoreVersion function', () => {
      const { result } = renderHook(() => useArticleVersions('test-article'), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.restoreVersion).toBe('function');
    });

    it('should have isRestoring state', () => {
      const { result } = renderHook(() => useArticleVersions('test-article'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isRestoring).toBe(false);
    });
  });

  describe('refetch', () => {
    it('should have refetch function', () => {
      const { result } = renderHook(() => useArticleVersions('test-article'), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.refetch).toBe('function');
    });
  });
});

describe('queryKeys', () => {
  it('should create correct query key for versions', async () => {
    const { queryKeys } = await import('@/lib/query-keys');

    const key = queryKeys.versions('test-slug');
    expect(key).toEqual(['versions', 'test-slug']);
  });
});

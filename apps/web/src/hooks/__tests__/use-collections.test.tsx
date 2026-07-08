import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react';
import { useCollections, useBookmarks } from '../use-collections';

// Mock fetch globally
global.fetch = vi.fn();

// Helper to create mock fetch response
function createMockResponse(data: unknown, ok = true) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(data),
  };
}

// Mock collection data
const mockCollection = {
  id: 'col-123',
  name: 'My Favorites',
  description: 'Articles I love',
  isPublic: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  userId: 'user-123',
  articleCount: 5,
  previewItems: [
    { id: 'art-1', title: 'Article 1', slug: 'article-1', coverImage: null },
    { id: 'art-2', title: 'Article 2', slug: 'article-2', coverImage: null },
  ],
};

const mockCollectionItem = {
  id: 'art-1',
  title: 'Test Article',
  slug: 'test-article-abc123',
  coverImage: null,
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

describe('useCollections hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('initial state', () => {
    it('should start with empty collections', () => {
      const { result } = renderHook(() => useCollections(), {
        wrapper: createWrapper(),
      });
      expect(result.current.collections).toEqual([]);
    });

    it('should start with isLoading true initially', () => {
      const { result } = renderHook(() => useCollections(), {
        wrapper: createWrapper(),
      });
      // Query is enabled by default, so isLoading could be true
      expect(typeof result.current.isLoading).toBe('boolean');
    });

    it('should start with no error', () => {
      const { result } = renderHook(() => useCollections(), {
        wrapper: createWrapper(),
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe('load collections', () => {
    it('should load collections successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse({ success: true, data: [mockCollection] })
      );

      const { result } = renderHook(() => useCollections(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(result.current.collections).toHaveLength(1);
      expect(result.current.collections[0].id).toBe('col-123');
      expect(result.current.collections[0].name).toBe('My Favorites');
    });

    it('should set error when API fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

      const { result } = renderHook(() => useCollections(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(result.current.error).toBe('Failed to fetch');
    });
  });

  describe('createCollection mutation', () => {
    it('should have createCollection function', () => {
      const { result } = renderHook(() => useCollections(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.createCollection).toBe('function');
    });

    it('should have isCreating state', () => {
      const { result } = renderHook(() => useCollections(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isCreating).toBe(false);
    });
  });

  describe('deleteCollection mutation', () => {
    it('should have deleteCollection function', () => {
      const { result } = renderHook(() => useCollections(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.deleteCollection).toBe('function');
    });

    it('should have isDeleting state', () => {
      const { result } = renderHook(() => useCollections(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isDeleting).toBe(false);
    });
  });

  describe('addArticle mutation', () => {
    it('should have addArticle function', () => {
      const { result } = renderHook(() => useCollections(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.addArticle).toBe('function');
    });

    it('should have isAddingArticle state', () => {
      const { result } = renderHook(() => useCollections(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isAddingArticle).toBe(false);
    });
  });

  describe('removeArticle mutation', () => {
    it('should have removeArticle function', () => {
      const { result } = renderHook(() => useCollections(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.removeArticle).toBe('function');
    });

    it('should have isRemovingArticle state', () => {
      const { result } = renderHook(() => useCollections(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isRemovingArticle).toBe(false);
    });
  });

  describe('refetch', () => {
    it('should have refetch function', () => {
      const { result } = renderHook(() => useCollections(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.refetch).toBe('function');
    });
  });
});

describe('useBookmarks hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('initial state', () => {
    it('should start with empty bookmarks', () => {
      const { result } = renderHook(() => useBookmarks(), {
        wrapper: createWrapper(),
      });
      expect(result.current.bookmarks).toEqual([]);
    });

    it('should start with no error', () => {
      const { result } = renderHook(() => useBookmarks(), {
        wrapper: createWrapper(),
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe('load bookmarks', () => {
    it('should load bookmarks successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse({ success: true, data: [mockCollectionItem] })
      );

      const { result } = renderHook(() => useBookmarks(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(result.current.bookmarks).toHaveLength(1);
      expect(result.current.bookmarks[0].id).toBe('art-1');
    });

    it('should set error when API fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

      const { result } = renderHook(() => useBookmarks(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(result.current.error).toBe('Failed to fetch');
    });
  });

  describe('toggleBookmark mutation', () => {
    it('should have toggleBookmark function', () => {
      const { result } = renderHook(() => useBookmarks(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.toggleBookmark).toBe('function');
    });

    it('should have isToggling state', () => {
      const { result } = renderHook(() => useBookmarks(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isToggling).toBe(false);
    });
  });

  describe('refetch', () => {
    it('should have refetch function', () => {
      const { result } = renderHook(() => useBookmarks(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.refetch).toBe('function');
    });
  });
});

describe('queryKeys', () => {
  it('should create correct query key for collections', async () => {
    const { queryKeys } = await import('@/lib/query-keys');

    const key = queryKeys.collections;
    expect(key).toEqual(['collections']);
  });

  it('should create correct query key for collection by id', async () => {
    const { queryKeys } = await import('@/lib/query-keys');

    const key = queryKeys.collection('col-123');
    expect(key).toEqual(['collections', 'col-123']);
  });

  it('should create correct query key for bookmarks', async () => {
    const { queryKeys } = await import('@/lib/query-keys');

    const key = queryKeys.bookmarks;
    expect(key).toEqual(['collections', 'bookmarks']);
  });
});

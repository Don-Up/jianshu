import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react';
import { useComments } from '../use-comments';
import type { CommentNode } from '@/types';

// Mock fetch globally
global.fetch = vi.fn();

// Helper to create mock fetch response
function createMockResponse(data: unknown, ok = true) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(data),
  };
}

// Mock nested comment data
const mockComment: CommentNode = {
  id: 'comment-1',
  content: '这是一条测试评论',
  createdAt: '2024-01-01T00:00:00Z',
  authorId: 'user-1',
  author: {
    id: 'user-1',
    username: 'testuser',
    name: 'Test User',
    avatar: null,
  },
  likeCount: 5,
  isLiked: false,
  parentId: null,
  replies: [],
};

const mockReply: CommentNode = {
  id: 'reply-1',
  content: '这是一条回复',
  createdAt: '2024-01-02T00:00:00Z',
  authorId: 'user-2',
  author: {
    id: 'user-2',
    username: 'anotheruser',
    name: 'Another User',
    avatar: null,
  },
  likeCount: 2,
  isLiked: true,
  parentId: 'comment-1',
  replies: [],
};

const mockNestedComment: CommentNode = {
  ...mockComment,
  replies: [mockReply],
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

describe('useComments hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('initial state', () => {
    it('should start with empty comments when slug is empty', () => {
      const { result } = renderHook(() => useComments(''), {
        wrapper: createWrapper(),
      });
      expect(result.current.comments).toEqual([]);
    });

    it('should start with isLoading false when disabled', () => {
      const { result } = renderHook(() => useComments(''), {
        wrapper: createWrapper(),
      });
      expect(result.current.isLoading).toBe(false);
    });

    it('should start with no error', () => {
      const { result } = renderHook(() => useComments(''), {
        wrapper: createWrapper(),
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe('load comments by slug', () => {
    it('should load comments successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse({ success: true, data: [mockComment] })
      );

      const { result } = renderHook(() => useComments('test-article'), {
        wrapper: createWrapper(),
      });

      // Wait for query to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(result.current.comments).toHaveLength(1);
      expect(result.current.comments[0].id).toBe('comment-1');
    });

    it('should return nested comments with replies', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse({ success: true, data: [mockNestedComment] })
      );

      const { result } = renderHook(() => useComments('test-article'), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(result.current.comments).toHaveLength(1);
      expect(result.current.comments[0].replies).toHaveLength(1);
      expect(result.current.comments[0].replies[0].id).toBe('reply-1');
    });

    it('should set error when API fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

      const { result } = renderHook(() => useComments('test-article'), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(result.current.error).toBe('Failed to fetch');
    });
  });

  describe('createComment mutation', () => {
    it('should have createComment function', () => {
      const { result } = renderHook(() => useComments('test-article'), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.createComment).toBe('function');
    });

    it('should have isCreating state', () => {
      const { result } = renderHook(() => useComments('test-article'), {
        wrapper: createWrapper(),
      });

      // isCreating should be false initially
      expect(result.current.isCreating).toBe(false);
    });
  });

  describe('deleteComment mutation', () => {
    it('should have deleteComment function', () => {
      const { result } = renderHook(() => useComments('test-article'), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.deleteComment).toBe('function');
    });

    it('should have isDeleting state', () => {
      const { result } = renderHook(() => useComments('test-article'), {
        wrapper: createWrapper(),
      });

      // isDeleting should be false initially
      expect(result.current.isDeleting).toBe(false);
    });
  });

  describe('likeComment mutation', () => {
    it('should have likeComment function', () => {
      const { result } = renderHook(() => useComments('test-article'), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.likeComment).toBe('function');
    });

    it('should have isLiking state', () => {
      const { result } = renderHook(() => useComments('test-article'), {
        wrapper: createWrapper(),
      });

      // isLiking should be false initially
      expect(result.current.isLiking).toBe(false);
    });
  });

  describe('refetch', () => {
    it('should have refetch function', () => {
      const { result } = renderHook(() => useComments('test-article'), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.refetch).toBe('function');
    });
  });
});

describe('queryKeys', () => {
  it('should create correct query key for comments', async () => {
    const { queryKeys } = await import('@/lib/query-keys');

    const key = queryKeys.comments('test-slug');
    expect(key).toEqual(['comments', 'test-slug']);
  });
});

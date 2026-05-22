import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useComments } from '../use-comments';

// Mock fetch globally
global.fetch = vi.fn();

// Helper to create mock fetch response
function createMockResponse(data: unknown, ok = true) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(data),
  };
}

// Mock comment data
const mockComment = {
  id: 'comment-1',
  content: '这是一条测试评论',
  createdAt: new Date('2024-01-01'),
  author: {
    id: 'user-1',
    username: 'testuser',
    name: 'Test User',
    avatar: null,
  },
};

const mockComment2 = {
  id: 'comment-2',
  content: '这是第二条评论',
  createdAt: new Date('2024-01-02'),
  author: {
    id: 'user-2',
    username: 'anotheruser',
    name: 'Another User',
    avatar: null,
  },
};

// Mock PaginatedResponse structure
const mockPaginatedResponse = (items: any[], totalPages = 1) => ({
  success: true,
  data: {
    items,
    totalPages,
    totalCount: items.length,
    page: 1,
    limit: 10,
  },
  error: null,
});

describe('useComments hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('initial state', () => {
    it('should start with empty comments', () => {
      const { result } = renderHook(() => useComments());
      expect(result.current.comments).toEqual([]);
    });

    it('should start with isLoading false', () => {
      const { result } = renderHook(() => useComments());
      expect(result.current.isLoading).toBe(false);
    });

    it('should start with no error', () => {
      const { result } = renderHook(() => useComments());
      expect(result.current.error).toBeNull();
    });

    it('should start with hasMore false', () => {
      const { result } = renderHook(() => useComments());
      expect(result.current.hasMore).toBe(false);
    });
  });

  describe('loadComments', () => {
    it('should load comments successfully on page 1', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse(mockPaginatedResponse([mockComment]))
      );

      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.loadComments('article-1', 1);
      });

      expect(result.current.comments).toHaveLength(1);
      expect(result.current.comments[0].id).toBe('comment-1');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should replace comments on page 1', async () => {
      // First call: load page 1
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse(mockPaginatedResponse([mockComment]))
      );

      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.loadComments('article-1', 1);
      });

      expect(result.current.comments).toHaveLength(1);

      // Second call: reload page 1 (refresh) - should replace, not append
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse(mockPaginatedResponse([mockComment2]))
      );

      await act(async () => {
        await result.current.loadComments('article-1', 1);
      });

      // Should be replaced, not appended
      expect(result.current.comments).toHaveLength(1);
      expect(result.current.comments[0].id).toBe('comment-2');
    });

    it('should append comments on page > 1', async () => {
      // First call: load page 1
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse(mockPaginatedResponse([mockComment]))
      );

      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.loadComments('article-1', 1);
      });

      // Second call: load page 2 - should append
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse(mockPaginatedResponse([mockComment2], 2))
      );

      await act(async () => {
        await result.current.loadComments('article-1', 2);
      });

      // Should be appended, not replaced
      expect(result.current.comments).toHaveLength(2);
      expect(result.current.comments[0].id).toBe('comment-1');
      expect(result.current.comments[1].id).toBe('comment-2');
    });

    it('should set hasMore correctly when more pages exist', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse({
          success: true,
          data: {
            items: [mockComment],
            totalPages: 3,
            totalCount: 3,
            page: 1,
            limit: 10,
          },
          error: null,
        })
      );

      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.loadComments('article-1', 1);
      });

      expect(result.current.hasMore).toBe(true);
    });

    it('should set hasMore false when on last page', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse({
          success: true,
          data: {
            items: [mockComment],
            totalPages: 1,
            totalCount: 1,
            page: 1,
            limit: 10,
          },
          error: null,
        })
      );

      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.loadComments('article-1', 1);
      });

      expect(result.current.hasMore).toBe(false);
    });

    it('should set error when API returns failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse({ success: false, error: 'Failed to load comments' })
      );

      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.loadComments('article-1', 1);
      });

      expect(result.current.error).toBe('Failed to load comments');
    });

    it('should set error on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.loadComments('article-1', 1);
      });

      expect(result.current.error).toBe('Network error');
    });
  });

  describe('createComment', () => {
    it('should add new comment to the beginning of the list', async () => {
      // First load some comments
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse(mockPaginatedResponse([mockComment]))
      );

      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.loadComments('article-1', 1);
      });

      // Create new comment
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse({ success: true, data: mockComment2 })
      );

      await act(async () => {
        await result.current.createComment('article-1', '这是第二条评论');
      });

      // New comment should be at the beginning (reverse chronological order)
      expect(result.current.comments).toHaveLength(2);
      expect(result.current.comments[0].id).toBe('comment-2');
      expect(result.current.comments[1].id).toBe('comment-1');
    });

    it('should return false when API returns failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse({ success: false, error: 'Failed to create comment' })
      );

      const { result } = renderHook(() => useComments());

      let success: boolean = false;
      await act(async () => {
        success = await result.current.createComment('article-1', 'test content');
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe('Failed to create comment');
    });

    it('should return false on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useComments());

      let success: boolean = false;
      await act(async () => {
        success = await result.current.createComment('article-1', 'test content');
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe('Network error');
    });
  });

  describe('deleteComment', () => {
    it('should remove comment from the list (optimistic update)', async () => {
      // First load some comments
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse(mockPaginatedResponse([mockComment, mockComment2]))
      );

      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.loadComments('article-1', 1);
      });

      expect(result.current.comments).toHaveLength(2);

      // Delete first comment
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse({ success: true })
      );

      await act(async () => {
        await result.current.deleteComment('article-1', 'comment-1');
      });

      // Comment should be removed immediately (optimistic update)
      expect(result.current.comments).toHaveLength(1);
      expect(result.current.comments[0].id).toBe('comment-2');
    });

    it('should return false when API returns failure', async () => {
      // First load some comments
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse(mockPaginatedResponse([mockComment]))
      );

      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.loadComments('article-1', 1);
      });

      // Delete fails
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse({ success: false, error: 'Failed to delete comment' })
      );

      let success: boolean = false;
      await act(async () => {
        success = await result.current.deleteComment('article-1', 'comment-1');
      });

      expect(success).toBe(false);
      expect(result.current.error).toBe('Failed to delete comment');
    });
  });

  describe('loadMore', () => {
    it('should not load more when hasMore is false', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse(mockPaginatedResponse([mockComment]))
      );

      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.loadComments('article-1', 1);
      });

      expect(result.current.hasMore).toBe(false);

      await act(async () => {
        await result.current.loadMore();
      });

      // No additional fetch should be made since hasMore is false
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should load next page when hasMore is true', async () => {
      // Load first page
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse({
          success: true,
          data: {
            items: [mockComment],
            totalPages: 2,
            totalCount: 2,
            page: 1,
            limit: 10,
          },
          error: null,
        })
      );

      const { result } = renderHook(() => useComments());

      await act(async () => {
        await result.current.loadComments('article-1', 1);
      });

      // Load more (page 2)
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse({
          success: true,
          data: {
            items: [mockComment2],
            totalPages: 2,
            totalCount: 2,
            page: 2,
            limit: 10,
          },
          error: null,
        })
      );

      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.comments).toHaveLength(2);
      expect(result.current.hasMore).toBe(false);
    });
  });
});
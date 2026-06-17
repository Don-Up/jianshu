import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useNotifications } from '../use-notifications';
import type { Notification } from '@jianshu/shared';

// Mock notificationApi
vi.mock('@/lib/api', () => ({
  notificationApi: {
    list: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));

import { notificationApi } from '@/lib/api';

const mockNotification: Notification = {
  id: 'notification-1',
  type: 'COMMENT',
  message: '评论了你的文章',
  link: '/article/test-article',
  isRead: false,
  createdAt: new Date('2024-01-01'),
  actor: {
    id: 'user-1',
    username: 'testuser',
    name: 'Test User',
    avatar: null,
  },
  article: {
    id: 'article-1',
    title: 'Test Article',
    slug: 'test-article',
  },
};

const mockNotification2: Notification = {
  id: 'notification-2',
  type: 'LIKE',
  message: '点赞了你的文章',
  link: '/article/another-article',
  isRead: true,
  createdAt: new Date('2024-01-02'),
  actor: {
    id: 'user-2',
    username: 'anotheruser',
    name: 'Another User',
    avatar: null,
  },
  article: {
    id: 'article-2',
    title: 'Another Article',
    slug: 'another-article',
  },
};

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

describe('useNotifications hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should start with empty notifications', async () => {
      (notificationApi.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: true,
        data: {
          items: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });

      const { result } = renderHook(() => useNotifications(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.notifications).toEqual([]);
      });
    });

    it('should start with total 0', async () => {
      (notificationApi.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: true,
        data: {
          items: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });

      const { result } = renderHook(() => useNotifications(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.total).toBe(0);
      });
    });

    it('should start with unreadCount 0 when no notifications', async () => {
      (notificationApi.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: true,
        data: {
          items: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });

      const { result } = renderHook(() => useNotifications(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.unreadCount).toBe(0);
      });
    });
  });

  describe('fetching notifications', () => {
    it('should fetch notifications successfully', async () => {
      (notificationApi.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: true,
        data: {
          items: [mockNotification, mockNotification2],
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });

      const { result } = renderHook(() => useNotifications(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
        expect(result.current.total).toBe(2);
      });
    });

    it('should calculate unreadCount correctly', async () => {
      (notificationApi.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: true,
        data: {
          items: [mockNotification, mockNotification2],
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });

      const { result } = renderHook(() => useNotifications(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.unreadCount).toBe(1); // Only mockNotification is unread
      });
    });

    it('should handle empty notifications list', async () => {
      (notificationApi.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: true,
        data: {
          items: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });

      const { result } = renderHook(() => useNotifications(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(0);
        expect(result.current.unreadCount).toBe(0);
      });
    });
  });

  describe('markAsRead', () => {
    it('should have markAsRead function', async () => {
      (notificationApi.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: true,
        data: {
          items: [mockNotification],
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });

      const { result } = renderHook(() => useNotifications(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(typeof result.current.markAsRead).toBe('function');
      });
    });

    it('should call notificationApi.markAsRead with correct id', async () => {
      (notificationApi.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: true,
        data: {
          items: [mockNotification],
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });

      (notificationApi.markAsRead as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: true,
      });

      const { result } = renderHook(() => useNotifications(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1);
      });

      act(() => {
        result.current.markAsRead('notification-1');
      });

      await waitFor(() => {
        expect(notificationApi.markAsRead).toHaveBeenCalledWith('notification-1');
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should have markAllAsRead function', async () => {
      (notificationApi.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: true,
        data: {
          items: [mockNotification],
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });

      const { result } = renderHook(() => useNotifications(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(typeof result.current.markAllAsRead).toBe('function');
      });
    });

    it('should call notificationApi.markAllAsRead', async () => {
      (notificationApi.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: true,
        data: {
          items: [mockNotification],
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });

      (notificationApi.markAllAsRead as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: true,
      });

      const { result } = renderHook(() => useNotifications(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1);
      });

      act(() => {
        result.current.markAllAsRead();
      });

      await waitFor(() => {
        expect(notificationApi.markAllAsRead).toHaveBeenCalled();
      });
    });
  });
});
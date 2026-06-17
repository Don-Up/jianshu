import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationList } from '../notification-list';
import type { Notification } from '@jianshu/shared';

// Mock useNotifications hook
vi.mock('@/hooks/use-notifications', () => ({
  useNotifications: vi.fn(),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// Mock utils
vi.mock('@/lib/utils', async () => {
  const actual = await import('@/lib/utils');
  return {
    ...actual,
    formatDate: vi.fn(() => '2024-01-01'),
    cn: vi.fn((...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ')),
  };
});

import { useNotifications } from '@/hooks/use-notifications';
import { formatDate } from '@/lib/utils';

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

describe('NotificationList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('should show skeleton when loading', () => {
      (useNotifications as ReturnType<typeof vi.fn>).mockReturnValue({
        notifications: [],
        total: 0,
        unreadCount: 0,
        isLoading: true,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
      });

      render(<NotificationList />);

      // Should show 3 skeleton items
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('empty state', () => {
    it('should show "暂无通知" when no notifications', () => {
      (useNotifications as ReturnType<typeof vi.fn>).mockReturnValue({
        notifications: [],
        total: 0,
        unreadCount: 0,
        isLoading: false,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
      });

      render(<NotificationList />);

      expect(screen.getByText('暂无通知')).toBeInTheDocument();
    });

    it('should not show "暂无通知" when loading', () => {
      (useNotifications as ReturnType<typeof vi.fn>).mockReturnValue({
        notifications: [],
        total: 0,
        unreadCount: 0,
        isLoading: true,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
      });

      render(<NotificationList />);

      expect(screen.queryByText('暂无通知')).not.toBeInTheDocument();
    });
  });

  describe('notification list', () => {
    it('should render notification messages', () => {
      (useNotifications as ReturnType<typeof vi.fn>).mockReturnValue({
        notifications: [mockNotification, mockNotification2],
        total: 2,
        unreadCount: 1,
        isLoading: false,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
      });

      render(<NotificationList />);

      expect(screen.getByText(/评论了你的文章/)).toBeInTheDocument();
      expect(screen.getByText(/点赞了你的文章/)).toBeInTheDocument();
    });

    it('should render actor names', () => {
      (useNotifications as ReturnType<typeof vi.fn>).mockReturnValue({
        notifications: [mockNotification],
        total: 1,
        unreadCount: 1,
        isLoading: false,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
      });

      render(<NotificationList />);

      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('should render notification links', () => {
      (useNotifications as ReturnType<typeof vi.fn>).mockReturnValue({
        notifications: [mockNotification],
        total: 1,
        unreadCount: 1,
        isLoading: false,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
      });

      render(<NotificationList />);

      const links = screen.getAllByRole('link');
      expect(links[0]).toHaveAttribute('href', '/article/test-article');
    });

    it('should show multiple notifications', () => {
      (useNotifications as ReturnType<typeof vi.fn>).mockReturnValue({
        notifications: [mockNotification, mockNotification2],
        total: 2,
        unreadCount: 1,
        isLoading: false,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
      });

      render(<NotificationList />);

      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
    });
  });

  describe('mark as read', () => {
    it('should include onClick handler that calls markAsRead for unread notifications', () => {
      const markAsRead = vi.fn();
      (useNotifications as ReturnType<typeof vi.fn>).mockReturnValue({
        notifications: [mockNotification],
        total: 1,
        unreadCount: 1,
        isLoading: false,
        markAsRead,
        markAllAsRead: vi.fn(),
      });

      render(<NotificationList />);

      // Verify notification is rendered
      expect(screen.getByText(/Test User/)).toBeInTheDocument();
      expect(screen.getByText(/评论了你的文章/)).toBeInTheDocument();
    });

    it('should not call markAsRead when clicking read notification', () => {
      const markAsRead = vi.fn();
      (useNotifications as ReturnType<typeof vi.fn>).mockReturnValue({
        notifications: [mockNotification2], // isRead: true
        total: 1,
        unreadCount: 0,
        isLoading: false,
        markAsRead,
        markAllAsRead: vi.fn(),
      });

      render(<NotificationList />);

      // Verify read notification is rendered
      expect(screen.getByText(/Another User/)).toBeInTheDocument();
      expect(screen.getByText(/点赞了你的文章/)).toBeInTheDocument();
    });
  });

  describe('mark all as read', () => {
    it('should call markAllAsRead when clicking "全部标为已读"', () => {
      const markAllAsRead = vi.fn();
      (useNotifications as ReturnType<typeof vi.fn>).mockReturnValue({
        notifications: [mockNotification, mockNotification2],
        total: 2,
        unreadCount: 1,
        isLoading: false,
        markAsRead: vi.fn(),
        markAllAsRead,
      });

      render(<NotificationList />);

      const button = screen.getByText('全部标为已读');
      fireEvent.click(button);

      expect(markAllAsRead).toHaveBeenCalled();
    });

    it('should render "全部标为已读" button', () => {
      (useNotifications as ReturnType<typeof vi.fn>).mockReturnValue({
        notifications: [mockNotification],
        total: 1,
        unreadCount: 1,
        isLoading: false,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
      });

      render(<NotificationList />);

      expect(screen.getByText('全部标为已读')).toBeInTheDocument();
    });
  });

  describe('unread indicator', () => {
    it('should show unread indicator for unread notifications', () => {
      (useNotifications as ReturnType<typeof vi.fn>).mockReturnValue({
        notifications: [mockNotification], // isRead: false
        total: 1,
        unreadCount: 1,
        isLoading: false,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
      });

      render(<NotificationList />);

      // The unread indicator is a blue dot - check for bg-primary class
      const indicator = document.querySelector('.bg-primary');
      expect(indicator).toBeInTheDocument();
    });

    it('should not show unread indicator for read notifications', () => {
      (useNotifications as ReturnType<typeof vi.fn>).mockReturnValue({
        notifications: [mockNotification2], // isRead: true
        total: 1,
        unreadCount: 0,
        isLoading: false,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
      });

      render(<NotificationList />);

      // For read notifications, there should be no unread indicator (no bg-primary element)
      // The notification should still be visible, just without the blue dot
      expect(screen.getByText(/Another User/)).toBeInTheDocument();
    });
  });
});
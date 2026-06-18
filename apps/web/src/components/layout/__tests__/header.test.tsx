import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '../header';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock use-auth hook
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      email: 'test@example.com',
      username: 'testuser',
      name: 'Test User',
      bio: null,
      avatar: null,
    },
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));

// Mock use-notifications hook
vi.mock('@/hooks/use-notifications', () => ({
  useNotifications: () => ({
    unreadCount: 5,
    notifications: [],
    isLoading: false,
  }),
}));

describe('Header Notification Badge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show notification bell icon', () => {
    render(<Header />);
    // The SVG bell icon exists - check for the SVG element within the notification link
    const svgElements = document.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });

  it('should link to /notifications page', () => {
    render(<Header />);
    const notificationLink = screen.getByRole('link', { name: '5' });
    expect(notificationLink).toHaveAttribute('href', '/notifications');
  });

  it('should show unread count badge when unreadCount > 0', () => {
    render(<Header />);
    const badge = screen.getByText('5');
    expect(badge).toBeInTheDocument();
  });

  it('should show badge with destructive color when unreadCount > 0', () => {
    render(<Header />);
    const badge = screen.getByText('5');
    expect(badge).toHaveClass('bg-destructive');
  });

  it('should not show badge when unreadCount is 0', () => {
    vi.doMock('@/hooks/use-notifications', () => ({
      useNotifications: () => ({
        unreadCount: 0,
        notifications: [],
        isLoading: false,
      }),
    }));

    render(<Header />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProfileHeader } from '../profile-header';
import { userApi } from '@/lib/api';
import type { User } from '@jianshu/shared';

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  username: 'testuser',
  name: 'Test User',
  bio: 'I love writing',
  avatar: null,
  createdAt: new Date('2024-01-01'),
  followerCount: 100,
  followingCount: 50,
  articleCount: 25,
};

// Mock API
const mockFollow = vi.fn();
vi.mock('@/lib/api', () => ({
  userApi: {
    follow: (...args: unknown[]) => mockFollow(...args),
  },
}));

// Create a real QueryClient for testing
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function Wrapper({ children, queryClient }: { children: React.ReactNode; queryClient: QueryClient }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('ProfileHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFollow.mockResolvedValue({ success: true, data: { isFollowing: true } });
  });

  describe('Rendering', () => {
    it('should render user name', () => {
      const queryClient = createTestQueryClient();
      render(
        <Wrapper queryClient={queryClient}>
          <ProfileHeader user={mockUser} />
        </Wrapper>
      );
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('should render user bio', () => {
      const queryClient = createTestQueryClient();
      render(
        <Wrapper queryClient={queryClient}>
          <ProfileHeader user={mockUser} />
        </Wrapper>
      );
      expect(screen.getByText('I love writing')).toBeInTheDocument();
    });

    it('should render follower count', () => {
      const queryClient = createTestQueryClient();
      render(
        <Wrapper queryClient={queryClient}>
          <ProfileHeader user={mockUser} />
        </Wrapper>
      );
      expect(screen.getByText(/^100$/)).toBeInTheDocument();
      expect(screen.getByText('粉丝')).toBeInTheDocument();
    });

    it('should render following count', () => {
      const queryClient = createTestQueryClient();
      render(
        <Wrapper queryClient={queryClient}>
          <ProfileHeader user={mockUser} />
        </Wrapper>
      );
      expect(screen.getByText(/^50$/)).toBeInTheDocument();
      expect(screen.getByText('关注', { selector: 'span' })).toBeInTheDocument();
    });

    it('should render article count', () => {
      const queryClient = createTestQueryClient();
      render(
        <Wrapper queryClient={queryClient}>
          <ProfileHeader user={mockUser} />
        </Wrapper>
      );
      expect(screen.getByText(/^25$/)).toBeInTheDocument();
      expect(screen.getByText('文章')).toBeInTheDocument();
    });

    it('should not render bio dot when bio is empty', () => {
      const userWithoutBio = { ...mockUser, bio: null };
      const queryClient = createTestQueryClient();
      render(
        <Wrapper queryClient={queryClient}>
          <ProfileHeader user={userWithoutBio} />
        </Wrapper>
      );
      expect(screen.queryByText('·')).not.toBeInTheDocument();
    });

    it('should render dot separator when bio exists', () => {
      const queryClient = createTestQueryClient();
      render(
        <Wrapper queryClient={queryClient}>
          <ProfileHeader user={mockUser} />
        </Wrapper>
      );
      expect(screen.getByText('·')).toBeInTheDocument();
    });
  });

  describe('Follow button (not own profile)', () => {
    it('should show Follow button when not own profile', () => {
      const queryClient = createTestQueryClient();
      render(
        <Wrapper queryClient={queryClient}>
          <ProfileHeader user={mockUser} isOwnProfile={false} />
        </Wrapper>
      );
      expect(screen.getByRole('button', { name: '关注' })).toBeInTheDocument();
    });

    it('should not show Follow button when is own profile', () => {
      const queryClient = createTestQueryClient();
      render(
        <Wrapper queryClient={queryClient}>
          <ProfileHeader user={mockUser} isOwnProfile={true} />
        </Wrapper>
      );
      expect(screen.queryByRole('button', { name: '关注' })).not.toBeInTheDocument();
    });

    it('should show Following button after following', async () => {
      const queryClient = createTestQueryClient();
      const userEventLib = userEvent.setup();

      render(
        <Wrapper queryClient={queryClient}>
          <ProfileHeader user={mockUser} isOwnProfile={false} initialIsFollowing={false} />
        </Wrapper>
      );

      const followBtn = screen.getByRole('button', { name: '关注' });
      await userEventLib.click(followBtn);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '已关注' })).toBeInTheDocument();
      });
    });
  });

  describe('Edit profile button (own profile)', () => {
    it('should show Edit Profile button when is own profile', () => {
      const queryClient = createTestQueryClient();
      render(
        <Wrapper queryClient={queryClient}>
          <ProfileHeader user={mockUser} isOwnProfile={true} />
        </Wrapper>
      );
      expect(screen.getByRole('button', { name: '编辑个人资料' })).toBeInTheDocument();
    });

    it('should not show Edit Profile button when not own profile', () => {
      const queryClient = createTestQueryClient();
      render(
        <Wrapper queryClient={queryClient}>
          <ProfileHeader user={mockUser} isOwnProfile={false} />
        </Wrapper>
      );
      expect(screen.queryByRole('button', { name: '编辑个人资料' })).not.toBeInTheDocument();
    });
  });

  describe('Avatar', () => {
    it('should render avatar with user initials', () => {
      const queryClient = createTestQueryClient();
      render(
        <Wrapper queryClient={queryClient}>
          <ProfileHeader user={mockUser} />
        </Wrapper>
      );
      expect(screen.getByText('TE')).toBeInTheDocument();
    });
  });

  describe('Optimistic update', () => {
    it('should update UI immediately without waiting for API response', async () => {
      const queryClient = createTestQueryClient();
      const userEventLib = userEvent.setup();

      render(
        <Wrapper queryClient={queryClient}>
          <ProfileHeader user={mockUser} isOwnProfile={false} initialIsFollowing={false} />
        </Wrapper>
      );

      const followBtn = screen.getByRole('button', { name: '关注' });
      await userEventLib.click(followBtn);

      // UI should update immediately, not after API response
      expect(screen.getByRole('button', { name: '已关注' })).toBeInTheDocument();
    });

    it('should call API when follow button is clicked', async () => {
      const queryClient = createTestQueryClient();
      const userEventLib = userEvent.setup();

      render(
        <Wrapper queryClient={queryClient}>
          <ProfileHeader user={mockUser} isOwnProfile={false} initialIsFollowing={false} />
        </Wrapper>
      );

      const followBtn = screen.getByRole('button', { name: '关注' });
      await userEventLib.click(followBtn);

      await waitFor(() => {
        expect(mockFollow).toHaveBeenCalledWith(mockUser.id);
      });
    });
  });

  describe('Rollback on error', () => {
    it('should rollback to previous state when API fails', async () => {
      mockFollow.mockRejectedValue(new Error('Network error'));

      const queryClient = createTestQueryClient();
      const userEventLib = userEvent.setup();

      render(
        <Wrapper queryClient={queryClient}>
          <ProfileHeader user={mockUser} isOwnProfile={false} initialIsFollowing={false} />
        </Wrapper>
      );

      const followBtn = screen.getByRole('button', { name: '关注' });
      await userEventLib.click(followBtn);

      await waitFor(() => {
        // Should revert to "关注" button after error
        expect(screen.getByRole('button', { name: '关注' })).toBeInTheDocument();
      });
    });
  });
});

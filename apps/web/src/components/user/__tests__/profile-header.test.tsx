import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileHeader } from '../profile-header';
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

vi.mock('@/lib/api', () => ({
  userApi: {
    follow: vi.fn().mockResolvedValue({ success: true, data: { isFollowing: true } }),
  },
}));

describe('ProfileHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render user name', () => {
      render(<ProfileHeader user={mockUser} />);
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('should render user bio', () => {
      render(<ProfileHeader user={mockUser} />);
      expect(screen.getByText('I love writing')).toBeInTheDocument();
    });

    it('should render follower count', () => {
      render(<ProfileHeader user={mockUser} />);
      expect(screen.getByText(/^100$/)).toBeInTheDocument();
      expect(screen.getByText('粉丝')).toBeInTheDocument();
    });

    it('should render following count', () => {
      render(<ProfileHeader user={mockUser} />);
      expect(screen.getByText(/^50$/)).toBeInTheDocument();
      expect(screen.getByText('关注', { selector: 'span' })).toBeInTheDocument();
    });

    it('should render article count', () => {
      render(<ProfileHeader user={mockUser} />);
      expect(screen.getByText(/^25$/)).toBeInTheDocument();
      expect(screen.getByText('文章')).toBeInTheDocument();
    });

    it('should not render bio dot when bio is empty', () => {
      const userWithoutBio = { ...mockUser, bio: null };
      render(<ProfileHeader user={userWithoutBio} />);
      expect(screen.queryByText('·')).not.toBeInTheDocument();
    });

    it('should render dot separator when bio exists', () => {
      render(<ProfileHeader user={mockUser} />);
      expect(screen.getByText('·')).toBeInTheDocument();
    });
  });

  describe('Follow button (not own profile)', () => {
    it('should show Follow button when not own profile', () => {
      render(<ProfileHeader user={mockUser} isOwnProfile={false} />);
      expect(screen.getByRole('button', { name: '关注' })).toBeInTheDocument();
    });

    it('should not show Follow button when is own profile', () => {
      render(<ProfileHeader user={mockUser} isOwnProfile={true} />);
      expect(screen.queryByRole('button', { name: '关注' })).not.toBeInTheDocument();
    });

    it('should show Following button after following', async () => {
      const userEventLib = userEvent.setup();
      render(<ProfileHeader user={mockUser} isOwnProfile={false} initialIsFollowing={false} />);

      const followBtn = screen.getByRole('button', { name: '关注' });
      await userEventLib.click(followBtn);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '已关注' })).toBeInTheDocument();
      });
    });
  });

  describe('Edit profile button (own profile)', () => {
    it('should show Edit Profile button when is own profile', () => {
      render(<ProfileHeader user={mockUser} isOwnProfile={true} />);
      expect(screen.getByRole('button', { name: '编辑个人资料' })).toBeInTheDocument();
    });

    it('should not show Edit Profile button when not own profile', () => {
      render(<ProfileHeader user={mockUser} isOwnProfile={false} />);
      expect(screen.queryByRole('button', { name: '编辑个人资料' })).not.toBeInTheDocument();
    });
  });

  describe('Avatar', () => {
    it('should render avatar with user initials', () => {
      render(<ProfileHeader user={mockUser} />);
      expect(screen.getByText('TE')).toBeInTheDocument();
    });
  });
});
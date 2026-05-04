import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import UserProfilePage from '@/app/user/[username]/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ username: 'testuser' }),
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', username: 'testuser', email: 'test@example.com', name: 'Test User' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

vi.mock('@/components/layout/page-layout', () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-layout">{children}</div>
  ),
}));

vi.mock('@/components/user/profile-header', () => ({
  ProfileHeader: ({ user, isOwnProfile }: { user: { name: string }; isOwnProfile: boolean }) => (
    <div data-testid="profile-header">
      <span>{user.name}</span>
      <span>{isOwnProfile ? 'own' : 'not-own'}</span>
    </div>
  ),
}));

vi.mock('@/components/article/article-list', () => ({
  ArticleList: ({ articles }: { articles: Array<{ id: string; title: string }> }) => (
    <div data-testid="article-list">
      {articles.map((a) => (
        <div key={a.id} data-testid="article-item">{a.title}</div>
      ))}
    </div>
  ),
}));

vi.mock('@/lib/api', () => ({
  userApi: {
    getByUsername: vi.fn().mockResolvedValue({
      success: true,
      data: {
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
      },
    }),
    getArticles: vi.fn().mockResolvedValue({
      success: true,
      data: {
        items: [
          {
            id: '1',
            title: 'First Article',
            slug: 'first-article',
            content: '<p>Content</p>',
            excerpt: 'Excerpt 1',
            coverImage: null,
            author: {
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
            },
            tags: ['tech'],
            likeCount: 10,
            commentCount: 5,
            readCount: 100,
            isLiked: false,
            isBookmarked: false,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    }),
  },
}));

describe('UserProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    render(<UserProfilePage />);
    expect(screen.getByTestId('page-layout')).toBeInTheDocument();
  });

  it('should fetch user profile and articles on mount', async () => {
    const { userApi } = await import('@/lib/api');
    render(<UserProfilePage />);

    await waitFor(() => {
      expect(userApi.getByUsername).toHaveBeenCalledWith('testuser');
      expect(userApi.getArticles).toHaveBeenCalledWith('testuser', { page: 1, limit: 20 });
    });
  });

  it('should render profile header when data loaded', async () => {
    render(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByTestId('profile-header')).toBeInTheDocument();
    });
  });

  it('should render article list with articles', async () => {
    render(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByTestId('article-list')).toBeInTheDocument();
      expect(screen.getByText('First Article')).toBeInTheDocument();
    });
  });

  it('should render user name in profile header', async () => {
    render(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  it('should pass isOwnProfile=true when viewing own profile', async () => {
    render(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('own')).toBeInTheDocument();
    });
  });

  it('should display bio in sidebar', async () => {
    render(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('I love writing')).toBeInTheDocument();
    });
  });

  it('should display article section title', async () => {
    render(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('文章')).toBeInTheDocument();
    });
  });

  it('should display sidebar section title', async () => {
    render(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('个人介绍')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should display error when profile not found', async () => {
      const { userApi } = await import('@/lib/api');
      (userApi.getByUsername as any).mockResolvedValueOnce({
        success: false,
        error: 'User not found',
      });

      render(<UserProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('用户不存在')).toBeInTheDocument();
      });
    });

    it('should display error when API returns error message', async () => {
      const { userApi } = await import('@/lib/api');
      (userApi.getByUsername as any).mockResolvedValueOnce({
        success: false,
        error: 'User not found',
      });

      render(<UserProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('用户不存在')).toBeInTheDocument();
      });
    });

    it('should handle exception during fetch', async () => {
      const { userApi } = await import('@/lib/api');
      (userApi.getByUsername as any).mockRejectedValueOnce(new Error('Server error'));

      render(<UserProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });
  });
});
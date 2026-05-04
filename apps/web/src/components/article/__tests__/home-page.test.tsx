import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Home from '@/app/page';
import type { ArticleWithAuthor } from '@/types';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock use-auth hook
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

// Mock Header to avoid useAuth error
vi.mock('@/components/layout/header', () => ({
  Header: () => <header data-testid="header">Header</header>,
}));

// Mock Footer
vi.mock('@/components/layout/footer', () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

// Mock PageLayout
vi.mock('@/components/layout/page-layout', () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-layout">
      <header>Header</header>
      <main>{children}</main>
      <footer>Footer</footer>
    </div>
  ),
}));

// Mock ArticleList
vi.mock('@/components/article/article-list', () => ({
  ArticleList: ({ articles, isLoading }: { articles: ArticleWithAuthor[]; isLoading?: boolean }) => (
    <div data-testid="article-list">
      {isLoading ? (
        <span>Loading...</span>
      ) : (
        articles.map((a) => (
          <div key={a.id} data-testid="article-item">
            {a.title}
          </div>
        ))
      )}
    </div>
  ),
}));

// Mock articleApi
vi.mock('@/lib/api', () => ({
  articleApi: {
    list: vi.fn().mockResolvedValue({
      items: [
        {
          id: '1',
          title: 'First Article',
          slug: 'first-article',
          content: '<p>Content 1</p>',
          excerpt: 'Excerpt 1',
          coverImage: null,
          author: {
            id: 'author-1',
            email: 'author1@example.com',
            username: 'author1',
            name: 'Author One',
            bio: null,
            avatar: null,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
          tags: ['tech'],
          likeCount: 10,
          commentCount: 5,
          readCount: 50,
          isLiked: false,
          isBookmarked: false,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: '2',
          title: 'Second Article',
          slug: 'second-article',
          content: '<p>Content 2</p>',
          excerpt: 'Excerpt 2',
          coverImage: null,
          author: {
            id: 'author-2',
            email: 'author2@example.com',
            username: 'author2',
            name: 'Author Two',
            bio: null,
            avatar: null,
            createdAt: new Date('2024-01-02'),
            updatedAt: new Date('2024-01-02'),
          },
          tags: ['life'],
          likeCount: 20,
          commentCount: 3,
          readCount: 100,
          isLiked: true,
          isBookmarked: false,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
      ],
      total: 2,
      page: 1,
      limit: 20,
      hasMore: false,
    }),
  },
}));

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render page title', () => {
    render(<Home />);
    expect(screen.getByText('发现')).toBeInTheDocument();
  });

  it('should fetch articles on mount', async () => {
    const { articleApi } = await import('@/lib/api');
    render(<Home />);
    await waitFor(() => {
      expect(articleApi.list).toHaveBeenCalledWith({ page: 1, limit: 20 });
    });
  });

  it('should render article list with articles', async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText('First Article')).toBeInTheDocument();
      expect(screen.getByText('Second Article')).toBeInTheDocument();
    });
  });

  it('should show loading state initially', () => {
    render(<Home />);
    // The component starts with isLoading true
    expect(screen.getByTestId('article-list')).toBeInTheDocument();
  });
});
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ArticleCard } from '../article-card';
import type { ArticleWithAuthor } from '@/types';

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

// Mock utils partially
vi.mock('@/lib/utils', async () => {
  const actual = await import('@/lib/utils');
  return {
    ...actual,
    formatDate: vi.fn((date: Date | string) => '2024-01-01'),
  };
});

// Mock Avatar components - with empty fallback to simplify text matching
vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="avatar">{children}</div>
  ),
  AvatarFallback: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="avatar-fallback">{children}</div>
  ),
  AvatarImage: () => <div data-testid="avatar-image" />,
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

// Mock Header which uses useAuth
vi.mock('@/components/layout/header', () => ({
  Header: () => <header data-testid="header">Header</header>,
}));

const mockArticle: ArticleWithAuthor = {
  id: '1',
  title: 'Test Article Title',
  slug: 'test-article-title',
  content: '<p>Test content</p>',
  excerpt: 'This is a test excerpt',
  coverImage: null,
  author: {
    id: 'author-1',
    email: 'test@example.com',
    username: 'testuser',
    name: 'Test User',
    bio: null,
    avatar: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  tags: ['test', 'article'],
  likeCount: 42,
  commentCount: 10,
  readCount: 100,
  isLiked: false,
  isBookmarked: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('ArticleCard', () => {
  it('should render article title', () => {
    render(<ArticleCard article={mockArticle} />);
    expect(screen.getByText('Test Article Title')).toBeInTheDocument();
  });

  it('should render article excerpt', () => {
    render(<ArticleCard article={mockArticle} />);
    expect(screen.getByText('This is a test excerpt')).toBeInTheDocument();
  });

  it('should render author name', () => {
    render(<ArticleCard article={mockArticle} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('should render like count', () => {
    render(<ArticleCard article={mockArticle} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should render comment count', () => {
    render(<ArticleCard article={mockArticle} />);
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should render cover image when provided', () => {
    const articleWithCover = {
      ...mockArticle,
      coverImage: 'https://example.com/cover.jpg',
    };
    render(<ArticleCard article={articleWithCover} />);
    const img = screen.getByAltText('Test Article Title') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toBe('https://example.com/cover.jpg');
  });

  it('should not render cover image when not provided', () => {
    render(<ArticleCard article={mockArticle} />);
    expect(screen.queryByAltText('Test Article Title')).not.toBeInTheDocument();
  });

  it('should link to correct article URL', () => {
    render(<ArticleCard article={mockArticle} />);
    const link = screen.getByRole('link', { name: 'Test Article Title' });
    expect(link).toHaveAttribute('href', '/article/test-article-title');
  });

  it('should link to correct author profile URL', () => {
    render(<ArticleCard article={mockArticle} />);
    // The link text includes avatar fallback "TE" followed by "Test User"
    const links = screen.getAllByRole('link');
    const authorLink = links.find(link => link.getAttribute('href') === '/user/testuser');
    expect(authorLink).toBeInTheDocument();
  });
});
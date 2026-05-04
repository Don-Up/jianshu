import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ArticleContent } from '../article-content';
import type { ArticleWithAuthor } from '@/types';

// Mock utils partially
vi.mock('@/lib/utils', async () => {
  const actual = await import('@/lib/utils');
  return {
    ...actual,
    formatDate: vi.fn((date: Date | string) => '2024-01-01'),
  };
});

// Mock Avatar components
vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="avatar">{children}</div>
  ),
  AvatarFallback: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="avatar-fallback">{children}</div>
  ),
  AvatarImage: () => <div data-testid="avatar-image" />,
}));

// Mock Button
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

const mockArticle: ArticleWithAuthor = {
  id: '1',
  title: 'Test Article Title',
  slug: 'test-article-title',
  content: '<p>This is the article content</p>',
  excerpt: 'Test excerpt',
  coverImage: null,
  author: {
    id: 'author-1',
    email: 'test@example.com',
    username: 'testuser',
    name: 'Test User',
    bio: null,
    avatar: null,
    createdAt: new Date('2024-01-01'),
  },
  tags: ['tag1', 'tag2'],
  likeCount: 42,
  commentCount: 10,
  readCount: 100,
  isLiked: true,
  isBookmarked: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('ArticleContent', () => {
  it('should render article title', () => {
    render(<ArticleContent article={mockArticle} />);
    expect(screen.getByText('Test Article Title')).toBeInTheDocument();
  });

  it('should render author name', () => {
    render(<ArticleContent article={mockArticle} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('should render read count', () => {
    render(<ArticleContent article={mockArticle} />);
    expect(screen.getByText(/100.*阅读/)).toBeInTheDocument();
  });

  it('should render like count', () => {
    render(<ArticleContent article={mockArticle} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should render tags', () => {
    render(<ArticleContent article={mockArticle} />);
    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
  });

  it('should render article content', () => {
    render(<ArticleContent article={mockArticle} />);
    const content = document.querySelector('.prose-jianshu');
    expect(content).toBeInTheDocument();
  });

  it('should call onLike when like button is clicked', () => {
    const onLike = vi.fn();
    render(<ArticleContent article={mockArticle} onLike={onLike} />);
    const likeButton = screen.getByRole('button', { name: /42/i });
    likeButton.click();
    expect(onLike).toHaveBeenCalledTimes(1);
  });

  it('should disable like button when isLiking is true', () => {
    const onLike = vi.fn();
    render(<ArticleContent article={mockArticle} onLike={onLike} isLiking={true} />);
    const likeButton = screen.getByRole('button', { name: /42/i }) as HTMLButtonElement;
    expect(likeButton.disabled).toBe(true);
  });

  it('should not render tags when array is empty', () => {
    const articleNoTags = { ...mockArticle, tags: [] };
    render(<ArticleContent article={articleNoTags} />);
    expect(screen.queryByText('tag1')).not.toBeInTheDocument();
  });
});
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ArticleList } from '../article-list';
import type { ArticleWithAuthor } from '@/types';

// Mock ArticleCard
vi.mock('../article-card', () => ({
  ArticleCard: ({ article }: { article: ArticleWithAuthor }) => (
    <div data-testid="article-card">{article.title}</div>
  ),
}));

const mockArticle: ArticleWithAuthor = {
  id: '1',
  title: 'Test Article',
  slug: 'test-article',
  content: '<p>Content</p>',
  excerpt: 'Excerpt',
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
  tags: [],
  likeCount: 0,
  commentCount: 0,
  readCount: 0,
  isLiked: false,
  isBookmarked: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('ArticleList', () => {
  it('should render loading skeleton when isLoading is true', () => {
    render(<ArticleList articles={[]} isLoading={true} />);
    // When loading, we show skeleton placeholders
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons).toHaveLength(3);
  });

  it('should render empty state when no articles', () => {
    render(<ArticleList articles={[]} isLoading={false} />);
    expect(screen.getByText('还没有文章')).toBeInTheDocument();
  });

  it('should render articles when provided', () => {
    const articles = [
      { ...mockArticle, id: '1', title: 'Article 1' },
      { ...mockArticle, id: '2', title: 'Article 2' },
    ];
    render(<ArticleList articles={articles} isLoading={false} />);
    expect(screen.getByText('Article 1')).toBeInTheDocument();
    expect(screen.getByText('Article 2')).toBeInTheDocument();
  });

  it('should render correct number of article cards', () => {
    const articles = [
      { ...mockArticle, id: '1' },
      { ...mockArticle, id: '2' },
      { ...mockArticle, id: '3' },
    ];
    render(<ArticleList articles={articles} isLoading={false} />);
    const cards = screen.getAllByTestId('article-card');
    expect(cards).toHaveLength(3);
  });
});
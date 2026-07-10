import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HistoryList } from '../history-list';

describe('HistoryList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockItem = {
    article: {
      id: 'article-123',
      title: 'Test Article',
      slug: 'test-article-abc123',
      excerpt: 'This is a test excerpt',
      coverImage: null,
      likeCount: 10,
      commentCount: 5,
      published: true,
      createdAt: '2026-07-10T00:00:00.000Z',
      author: {
        id: 'user-123',
        username: 'testuser',
        name: 'Test User',
        avatar: null,
      },
    },
    viewedAt: '2026-07-10T12:00:00.000Z',
  };

  describe('rendering', () => {
    it('should render history items', () => {
      render(
        <HistoryList
          items={[mockItem]}
          isLoading={false}
          onRemoveItem={vi.fn()}
        />
      );

      expect(screen.getByText('Test Article')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('should render empty state when no items', () => {
      render(
        <HistoryList
          items={[]}
          isLoading={false}
          onRemoveItem={vi.fn()}
        />
      );

      expect(screen.getByText('还没有阅读历史')).toBeInTheDocument();
      expect(screen.getByText('快去阅读一些文章吧')).toBeInTheDocument();
    });

    it('should render loading skeletons', () => {
      render(
        <HistoryList
          items={[]}
          isLoading={true}
          onRemoveItem={vi.fn()}
        />
      );

      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('interactions', () => {
    it('should call onRemoveItem when remove button clicked', () => {
      const onRemoveItem = vi.fn();
      render(
        <HistoryList
          items={[mockItem]}
          isLoading={false}
          onRemoveItem={onRemoveItem}
        />
      );

      const removeButton = screen.getByRole('button');
      removeButton.click();

      expect(onRemoveItem).toHaveBeenCalledWith('article-123');
    });
  });
});

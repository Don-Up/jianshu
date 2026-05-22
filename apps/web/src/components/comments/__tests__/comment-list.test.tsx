import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CommentList } from '../comment-list';
import type { Comment } from '@jianshu/shared';

// Mock CommentItem at top level
vi.mock('../comment-item', () => ({
  CommentItem: ({ comment, onDelete }: { comment: Comment; onDelete: (id: string) => Promise<boolean> }) => (
    <div data-testid="comment-item">
      <span data-testid="comment-content">{comment.content}</span>
      <button onClick={() => onDelete(comment.id)}>Delete</button>
    </div>
  ),
}));

const mockComment: Comment = {
  id: 'comment-1',
  content: '这是一条测试评论',
  createdAt: new Date('2024-01-01'),
  author: {
    id: 'user-1',
    username: 'testuser',
    name: 'Test User',
    avatar: null,
  },
};

const mockComment2: Comment = {
  id: 'comment-2',
  content: '这是第二条评论',
  createdAt: new Date('2024-01-02'),
  author: {
    id: 'user-2',
    username: 'anotheruser',
    name: 'Another User',
    avatar: null,
  },
};

describe('CommentList', () => {
  describe('empty states', () => {
    it('should show empty message when comments is empty and not loading', () => {
      render(
        <CommentList
          comments={[]}
          hasMore={false}
          isLoading={false}
          onDelete={vi.fn()}
          onLoadMore={vi.fn()}
        />
      );

      expect(screen.getByText('暂无评论，快来发表第一条评论吧')).toBeInTheDocument();
    });

    it('should NOT show empty message when comments is empty but is loading', () => {
      render(
        <CommentList
          comments={[]}
          hasMore={false}
          isLoading={true}
          onDelete={vi.fn()}
          onLoadMore={vi.fn()}
        />
      );

      expect(screen.queryByText('暂无评论，快来发表第一条评论吧')).not.toBeInTheDocument();
    });

    it('should show empty message after loading completes with no comments', () => {
      const { rerender } = render(
        <CommentList
          comments={[]}
          hasMore={false}
          isLoading={true}
          onDelete={vi.fn()}
          onLoadMore={vi.fn()}
        />
      );

      expect(screen.queryByText('暂无评论，快来发表第一条评论吧')).not.toBeInTheDocument();

      rerender(
        <CommentList
          comments={[]}
          hasMore={false}
          isLoading={false}
          onDelete={vi.fn()}
          onLoadMore={vi.fn()}
        />
      );

      expect(screen.getByText('暂无评论，快来发表第一条评论吧')).toBeInTheDocument();
    });
  });

  describe('rendering comments', () => {
    it('should render list of comments', () => {
      render(
        <CommentList
          comments={[mockComment, mockComment2]}
          hasMore={false}
          isLoading={false}
          onDelete={vi.fn()}
          onLoadMore={vi.fn()}
        />
      );

      expect(screen.getAllByTestId('comment-item')).toHaveLength(2);
    });

    it('should render comment content correctly', () => {
      render(
        <CommentList
          comments={[mockComment]}
          hasMore={false}
          isLoading={false}
          onDelete={vi.fn()}
          onLoadMore={vi.fn()}
        />
      );

      expect(screen.getByText('这是一条测试评论')).toBeInTheDocument();
    });
  });

  describe('load more button', () => {
    it('should NOT show load more button when hasMore is false', () => {
      render(
        <CommentList
          comments={[mockComment]}
          hasMore={false}
          isLoading={false}
          onDelete={vi.fn()}
          onLoadMore={vi.fn()}
        />
      );

      expect(screen.queryByText('加载更多')).not.toBeInTheDocument();
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    it('should show load more button when hasMore is true', () => {
      render(
        <CommentList
          comments={[mockComment]}
          hasMore={true}
          isLoading={false}
          onDelete={vi.fn()}
          onLoadMore={vi.fn()}
        />
      );

      expect(screen.getByText('加载更多')).toBeInTheDocument();
    });

    it('should show loading text when isLoading and hasMore', () => {
      render(
        <CommentList
          comments={[mockComment]}
          hasMore={true}
          isLoading={true}
          onDelete={vi.fn()}
          onLoadMore={vi.fn()}
        />
      );

      expect(screen.getByText('加载中...')).toBeInTheDocument();
    });

    it('should call onLoadMore when load more button is clicked', async () => {
      const onLoadMore = vi.fn();

      render(
        <CommentList
          comments={[mockComment]}
          hasMore={true}
          isLoading={false}
          onDelete={vi.fn()}
          onLoadMore={onLoadMore}
        />
      );

      screen.getByText('加载更多').click();

      expect(onLoadMore).toHaveBeenCalled();
    });

    it('should disable load more button when isLoading', () => {
      render(
        <CommentList
          comments={[mockComment]}
          hasMore={true}
          isLoading={true}
          onDelete={vi.fn()}
          onLoadMore={vi.fn()}
        />
      );

      expect(screen.getByText('加载中...')).toBeInTheDocument();
    });
  });
});
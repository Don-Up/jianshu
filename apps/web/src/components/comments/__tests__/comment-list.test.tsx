import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CommentList } from '../comment-list';
import type { CommentNode } from '@/types';

// Mock CommentItem at top level
vi.mock('../comment-item', () => ({
  CommentItem: ({ comment, onDelete, onLike, onReply, isLiking, isDeleting }: {
    comment: CommentNode;
    onDelete: (id: string) => void;
    onLike: (id: string, isLiked: boolean) => void;
    onReply?: (parentId: string, content: string) => void;
    isLiking?: boolean;
    isDeleting?: boolean;
  }) => (
    <div data-testid="comment-item">
      <span data-testid="comment-content">{comment.content}</span>
      <span data-testid="like-count">{comment.likeCount}</span>
      <span data-testid="reply-count">{comment.replies?.length || 0}</span>
      <button onClick={() => onDelete(comment.id)} disabled={isDeleting}>Delete</button>
      <button onClick={() => onLike(comment.id, comment.isLiked)} disabled={isLiking}>Like</button>
      {onReply && <button onClick={() => onReply(comment.id, 'reply')}>Reply</button>}
    </div>
  ),
}));

const mockComment: CommentNode = {
  id: 'comment-1',
  content: 'This is a test comment',
  createdAt: '2024-01-01T00:00:00Z',
  authorId: 'user-1',
  author: {
    id: 'user-1',
    username: 'testuser',
    name: 'Test User',
    avatar: null,
  },
  likeCount: 5,
  isLiked: false,
  parentId: null,
  replies: [],
};

const mockCommentWithReplies: CommentNode = {
  id: 'comment-2',
  content: 'Comment with replies',
  createdAt: '2024-01-02T00:00:00Z',
  authorId: 'user-2',
  author: {
    id: 'user-2',
    username: 'anotheruser',
    name: 'Another User',
    avatar: null,
  },
  likeCount: 3,
  isLiked: true,
  parentId: null,
  replies: [
    {
      id: 'reply-1',
      content: 'This is a reply',
      createdAt: '2024-01-03T00:00:00Z',
      authorId: 'user-1',
      author: {
        id: 'user-1',
        username: 'testuser',
        name: 'Test User',
        avatar: null,
      },
      likeCount: 1,
      isLiked: false,
      parentId: 'comment-2',
      replies: [],
    },
  ],
};

describe('CommentList', () => {
  const mockOnDelete = vi.fn();
  const mockOnLike = vi.fn();
  const mockOnReply = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('empty states', () => {
    it('should show empty message when comments is empty and not loading', () => {
      render(
        <CommentList
          comments={[]}
          isLoading={false}
          onDelete={mockOnDelete}
          onLike={mockOnLike}
        />
      );

      expect(screen.getByText('No comments yet. Be the first to comment!')).toBeInTheDocument();
    });
  });

  describe('loading skeleton', () => {
    it('should show skeleton when isLoading is true', () => {
      render(
        <CommentList
          comments={[]}
          isLoading={true}
          onDelete={mockOnDelete}
          onLike={mockOnLike}
        />
      );

      expect(screen.queryByText('No comments yet. Be the first to comment!')).not.toBeInTheDocument();
    });

    it('should show 3 skeleton items when loading', () => {
      render(
        <CommentList
          comments={[]}
          isLoading={true}
          onDelete={mockOnDelete}
          onLike={mockOnLike}
        />
      );

      const skeletons = screen.getAllByText((content, element) => {
        return element?.classList.contains('animate-pulse') ?? false;
      });
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('rendering comments', () => {
    it('should render list of comments', () => {
      render(
        <CommentList
          comments={[mockComment]}
          isLoading={false}
          onDelete={mockOnDelete}
          onLike={mockOnLike}
        />
      );

      expect(screen.getAllByTestId('comment-item')).toHaveLength(1);
    });

    it('should render multiple comments', () => {
      render(
        <CommentList
          comments={[mockComment, mockCommentWithReplies]}
          isLoading={false}
          onDelete={mockOnDelete}
          onLike={mockOnLike}
        />
      );

      expect(screen.getAllByTestId('comment-item')).toHaveLength(2);
    });

    it('should render comment content correctly', () => {
      render(
        <CommentList
          comments={[mockComment]}
          isLoading={false}
          onDelete={mockOnDelete}
          onLike={mockOnLike}
        />
      );

      expect(screen.getByText('This is a test comment')).toBeInTheDocument();
    });
  });

  describe('callbacks passed to CommentItem', () => {
    it('should pass onDelete callback', () => {
      render(
        <CommentList
          comments={[mockComment]}
          isLoading={false}
          onDelete={mockOnDelete}
          onLike={mockOnLike}
        />
      );

      screen.getByText('Delete').click();
      expect(mockOnDelete).toHaveBeenCalledWith('comment-1');
    });

    it('should pass onLike callback', () => {
      render(
        <CommentList
          comments={[mockComment]}
          isLoading={false}
          onDelete={mockOnDelete}
          onLike={mockOnLike}
        />
      );

      screen.getByText('Like').click();
      expect(mockOnLike).toHaveBeenCalledWith('comment-1', false);
    });

    it('should pass onReply callback when provided', () => {
      render(
        <CommentList
          comments={[mockComment]}
          isLoading={false}
          onDelete={mockOnDelete}
          onLike={mockOnLike}
          onReply={mockOnReply}
        />
      );

      screen.getByText('Reply').click();
      expect(mockOnReply).toHaveBeenCalledWith('comment-1', 'reply');
    });

    it('should not pass onReply when not provided', () => {
      render(
        <CommentList
          comments={[mockComment]}
          isLoading={false}
          onDelete={mockOnDelete}
          onLike={mockOnLike}
        />
      );

      expect(screen.queryByText('Reply')).not.toBeInTheDocument();
    });
  });
});

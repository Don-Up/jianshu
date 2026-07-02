import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CommentList } from '../comment-list';
import type { CommentNode } from '@/types';

// Mock CommentItem at top level
vi.mock('../comment-item', () => ({
  CommentItem: ({ comment, onDelete, onLike }: { comment: CommentNode; onDelete: (id: string) => void; onLike: (id: string, isLiked: boolean) => void }) => (
    <div data-testid="comment-item">
      <span data-testid="comment-content">{comment.content}</span>
      <button onClick={() => onDelete(comment.id)}>Delete</button>
      <button onClick={() => onLike(comment.id, comment.isLiked)}>Like</button>
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

const mockComment2: CommentNode = {
  id: 'comment-2',
  content: 'This is second comment',
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
  replies: [],
};

describe('CommentList', () => {
  const mockOnDelete = vi.fn();
  const mockOnLike = vi.fn();

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

  describe('rendering comments', () => {
    it('should render list of comments', () => {
      render(
        <CommentList
          comments={[mockComment, mockComment2]}
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
});

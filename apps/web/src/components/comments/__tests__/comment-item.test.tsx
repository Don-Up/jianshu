import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CommentItem } from '../comment-item';
import type { CommentNode } from '@/types';

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));

// Mock formatDate
vi.mock('@/lib/utils', async () => {
  const actual = await import('@/lib/utils');
  return {
    ...actual,
    formatDate: vi.fn(() => 'Jan 1, 2024'),
  };
});

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
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

const mockAuthorComment: CommentNode = {
  id: 'comment-2',
  content: 'This is author comment',
  createdAt: '2024-01-02T00:00:00Z',
  authorId: 'user-1',
  author: {
    id: 'user-1',
    username: 'testuser',
    name: 'Test User',
    avatar: null,
  },
  likeCount: 3,
  isLiked: true,
  parentId: null,
  replies: [],
};

const mockReply: CommentNode = {
  id: 'reply-1',
  content: 'This is a reply',
  createdAt: '2024-01-03T00:00:00Z',
  authorId: 'user-2',
  author: {
    id: 'user-2',
    username: 'otheruser',
    name: 'Other User',
    avatar: null,
  },
  likeCount: 1,
  isLiked: false,
  parentId: 'comment-1',
  replies: [],
};

const mockUser = { id: 'user-1', email: 'a@b.com', username: 'testuser', name: 'Test User', avatar: null, createdAt: new Date() };
const mockOtherUser = { id: 'user-2', email: 'other@b.com', username: 'other', name: 'Other', avatar: null, createdAt: new Date() };

describe('CommentItem', () => {
  const onDelete = vi.fn();
  const onLike = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render comment content', () => {
      mockUseAuth.mockReturnValue({ user: mockOtherUser, isLoading: false, isAuthenticated: true });

      render(<CommentItem comment={mockComment} onDelete={onDelete} onLike={onLike} />);

      expect(screen.getByText('This is a test comment')).toBeInTheDocument();
    });

    it('should render author name', () => {
      mockUseAuth.mockReturnValue({ user: mockOtherUser, isLoading: false, isAuthenticated: true });

      render(<CommentItem comment={mockComment} onDelete={onDelete} onLike={onLike} />);

      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('should render username with @ prefix', () => {
      mockUseAuth.mockReturnValue({ user: mockOtherUser, isLoading: false, isAuthenticated: true });

      render(<CommentItem comment={mockComment} onDelete={onDelete} onLike={onLike} />);

      expect(screen.getByText('@testuser')).toBeInTheDocument();
    });

    it('should render like count', () => {
      mockUseAuth.mockReturnValue({ user: mockOtherUser, isLoading: false, isAuthenticated: true });

      render(<CommentItem comment={mockComment} onDelete={onDelete} onLike={onLike} />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should render filled heart when liked', () => {
      mockUseAuth.mockReturnValue({ user: mockOtherUser, isLoading: false, isAuthenticated: true });

      render(<CommentItem comment={mockAuthorComment} onDelete={onDelete} onLike={onLike} />);

      expect(screen.getByText('❤️')).toBeInTheDocument();
    });
  });

  describe('delete button visibility', () => {
    it('should NOT show delete button when user is not the author', () => {
      mockUseAuth.mockReturnValue({ user: mockOtherUser, isLoading: false, isAuthenticated: true });

      render(<CommentItem comment={mockComment} onDelete={onDelete} onLike={onLike} />);

      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    it('should show delete button when user is the author', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, isLoading: false, isAuthenticated: true });

      render(<CommentItem comment={mockAuthorComment} onDelete={onDelete} onLike={onLike} />);

      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should NOT show delete button when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({ user: null, isLoading: false, isAuthenticated: false });

      render(<CommentItem comment={mockComment} onDelete={onDelete} onLike={onLike} />);

      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });
  });

  describe('delete functionality', () => {
    it('should call onDelete with comment id when delete button is clicked and confirmed', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser, isLoading: false, isAuthenticated: true });
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<CommentItem comment={mockAuthorComment} onDelete={onDelete} onLike={onLike} />);

      screen.getByText('Delete').click();

      await waitFor(() => {
        expect(onDelete).toHaveBeenCalledWith('comment-2');
      });

      confirmSpy.mockRestore();
    });

    it('should NOT call onDelete when user cancels confirmation', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser, isLoading: false, isAuthenticated: true });
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(<CommentItem comment={mockAuthorComment} onDelete={onDelete} onLike={onLike} />);

      screen.getByText('Delete').click();

      expect(onDelete).not.toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    it('should disable delete button when isDeleting is true', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, isLoading: false, isAuthenticated: true });

      render(<CommentItem comment={mockAuthorComment} onDelete={onDelete} onLike={onLike} isDeleting={true} />);

      expect(screen.getByText('Deleting...')).toBeInTheDocument();
    });
  });

  describe('like functionality', () => {
    it('should call onLike when like button is clicked', () => {
      mockUseAuth.mockReturnValue({ user: mockOtherUser, isLoading: false, isAuthenticated: true });

      render(<CommentItem comment={mockComment} onDelete={onDelete} onLike={onLike} />);

      screen.getByText('5').click();

      expect(onLike).toHaveBeenCalledWith('comment-1', false);
    });
  });

  describe('reply functionality', () => {
    const mockOnReply = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should show reply button', () => {
      mockUseAuth.mockReturnValue({ user: mockOtherUser, isLoading: false, isAuthenticated: true });

      render(<CommentItem comment={mockComment} onDelete={onDelete} onLike={onLike} />);

      expect(screen.getByText('Reply')).toBeInTheDocument();
    });
  });

  describe('nested replies', () => {
    it('should render nested replies', () => {
      mockUseAuth.mockReturnValue({ user: mockOtherUser, isLoading: false, isAuthenticated: true });

      const commentWithReplies: CommentNode = {
        ...mockComment,
        replies: [mockReply],
      };

      render(<CommentItem comment={commentWithReplies} onDelete={onDelete} onLike={onLike} />);

      expect(screen.getByText('This is a reply')).toBeInTheDocument();
    });
  });
});

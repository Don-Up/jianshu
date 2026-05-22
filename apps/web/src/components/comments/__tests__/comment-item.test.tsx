import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CommentItem } from '../comment-item';
import type { Comment } from '@jianshu/shared';

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));

// Mock formatDate
vi.mock('@/lib/utils', async () => {
  const actual = await import('@/lib/utils');
  return {
    ...actual,
    formatDate: vi.fn(() => '2024-01-01'),
  };
});

// Mock useAuth hook - define as variable so we can configure per test
const mockUseAuth = vi.fn();
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
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

const mockAuthorComment: Comment = {
  id: 'comment-2',
  content: '这是作者自己的评论',
  createdAt: new Date('2024-01-02'),
  author: {
    id: 'user-1',
    username: 'testuser',
    name: 'Test User',
    avatar: null,
  },
};

const mockUser = { id: 'user-1', email: 'a@b.com', username: 'testuser', name: 'Test User', avatar: null, createdAt: new Date() };
const mockOtherUser = { id: 'user-2', email: 'other@b.com', username: 'other', name: 'Other', avatar: null, createdAt: new Date() };

describe('CommentItem', () => {
  const onDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render comment content', () => {
      mockUseAuth.mockReturnValue({ user: mockOtherUser, isLoading: false, isAuthenticated: true });

      render(<CommentItem comment={mockComment} onDelete={onDelete} />);

      expect(screen.getByText('这是一条测试评论')).toBeInTheDocument();
    });

    it('should render author name', () => {
      mockUseAuth.mockReturnValue({ user: mockOtherUser, isLoading: false, isAuthenticated: true });

      render(<CommentItem comment={mockComment} onDelete={onDelete} />);

      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('should use username when name is not available', () => {
      mockUseAuth.mockReturnValue({ user: mockOtherUser, isLoading: false, isAuthenticated: true });

      const commentWithoutName = {
        ...mockComment,
        author: { ...mockComment.author, name: null },
      };

      render(<CommentItem comment={commentWithoutName} onDelete={onDelete} />);

      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    it('should render formatted date', () => {
      mockUseAuth.mockReturnValue({ user: mockOtherUser, isLoading: false, isAuthenticated: true });

      render(<CommentItem comment={mockComment} onDelete={onDelete} />);

      expect(screen.getByText('2024-01-01')).toBeInTheDocument();
    });
  });

  describe('delete button visibility', () => {
    it('should NOT show delete button when user is not the author', () => {
      mockUseAuth.mockReturnValue({ user: mockOtherUser, isLoading: false, isAuthenticated: true });

      render(<CommentItem comment={mockComment} onDelete={onDelete} />);

      expect(screen.queryByText('删除')).not.toBeInTheDocument();
    });

    it('should show delete button when user is the author', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, isLoading: false, isAuthenticated: true });

      render(<CommentItem comment={mockAuthorComment} onDelete={onDelete} />);

      expect(screen.getByText('删除')).toBeInTheDocument();
    });

    it('should NOT show delete button when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({ user: null, isLoading: false, isAuthenticated: false });

      render(<CommentItem comment={mockComment} onDelete={onDelete} />);

      expect(screen.queryByText('删除')).not.toBeInTheDocument();
    });
  });

  describe('delete functionality', () => {
    it('should call onDelete with comment id when delete button is clicked and confirmed', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser, isLoading: false, isAuthenticated: true });
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<CommentItem comment={mockAuthorComment} onDelete={onDelete} />);

      screen.getByText('删除').click();

      await waitFor(() => {
        expect(onDelete).toHaveBeenCalledWith('comment-2');
      });

      confirmSpy.mockRestore();
    });

    it('should NOT call onDelete when user cancels confirmation', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser, isLoading: false, isAuthenticated: true });
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(<CommentItem comment={mockAuthorComment} onDelete={onDelete} />);

      screen.getByText('删除').click();

      expect(onDelete).not.toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    it('should disable delete button when isDeleting is true', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, isLoading: false, isAuthenticated: true });

      render(<CommentItem comment={mockAuthorComment} onDelete={onDelete} isDeleting={true} />);

      expect(screen.getByText('删除')).toBeDisabled();
    });
  });
});
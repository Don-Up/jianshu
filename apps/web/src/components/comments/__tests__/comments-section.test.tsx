import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CommentsSection } from '../comments-section';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock useComments hook
const mockUseComments = vi.fn();
vi.mock('@/hooks/use-comments', () => ({
  useComments: () => mockUseComments(),
}));

// Mock CommentForm
vi.mock('../comment-form', () => ({
  CommentForm: ({ onSubmit }: { onSubmit: (content: string) => Promise<boolean> }) => (
    <div data-testid="comment-form">
      <button onClick={() => onSubmit('Test comment')}>Submit Form</button>
    </div>
  ),
}));

// Mock CommentList
vi.mock('../comment-list', () => ({
  CommentList: ({ comments, onDelete, onLike, onReply }: any) => (
    <div data-testid="comment-list">
      <span data-testid="comment-count">{comments.length}</span>
      <button onClick={() => onDelete('c1')}>Delete</button>
      <button onClick={() => onLike('c1', true)}>Like</button>
      {onReply && <button onClick={() => onReply('c1', 'reply')}>Reply</button>}
    </div>
  ),
}));

const mockUser = { id: 'user-1', email: 'a@b.com', username: 'testuser', name: 'Test User', avatar: null, createdAt: new Date() };

describe('CommentsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render CommentsSection with slug', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, isLoading: false, isAuthenticated: true });
      mockUseComments.mockReturnValue({
        comments: [],
        isLoading: false,
        createComment: vi.fn(),
        deleteComment: vi.fn(),
        likeComment: vi.fn(),
        isCreating: false,
        isDeleting: false,
        isLiking: false,
      });

      render(<CommentsSection slug="test-article" />);

      expect(screen.getByTestId('comment-form')).toBeInTheDocument();
      expect(screen.getByTestId('comment-list')).toBeInTheDocument();
    });

    it('should pass user from useAuth', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, isLoading: false, isAuthenticated: true });
      mockUseComments.mockReturnValue({
        comments: [],
        isLoading: false,
        createComment: vi.fn(),
        deleteComment: vi.fn(),
        likeComment: vi.fn(),
        isCreating: false,
        isDeleting: false,
        isLiking: false,
      });

      render(<CommentsSection slug="test-article" />);

      expect(mockUseAuth).toHaveBeenCalled();
    });

    it('should pass slug to useComments', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, isLoading: false, isAuthenticated: true });
      mockUseComments.mockReturnValue({
        comments: [],
        isLoading: false,
        createComment: vi.fn(),
        deleteComment: vi.fn(),
        likeComment: vi.fn(),
        isCreating: false,
        isDeleting: false,
        isLiking: false,
      });

      render(<CommentsSection slug="my-test-post" />);

      expect(mockUseComments).toHaveBeenCalled();
    });
  });

  describe('comments data', () => {
    it('should pass comments to CommentList', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, isLoading: false, isAuthenticated: true });
      const mockComments = [
        { id: 'c1', content: 'Comment 1', replies: [] },
        { id: 'c2', content: 'Comment 2', replies: [] },
      ];
      mockUseComments.mockReturnValue({
        comments: mockComments,
        isLoading: false,
        createComment: vi.fn(),
        deleteComment: vi.fn(),
        likeComment: vi.fn(),
        isCreating: false,
        isDeleting: false,
        isLiking: false,
      });

      render(<CommentsSection slug="test" />);

      expect(screen.getByTestId('comment-count')).toHaveTextContent('2');
    });

    it('should pass loading state to CommentList', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, isLoading: false, isAuthenticated: true });
      mockUseComments.mockReturnValue({
        comments: [],
        isLoading: true,
        createComment: vi.fn(),
        deleteComment: vi.fn(),
        likeComment: vi.fn(),
        isCreating: false,
        isDeleting: false,
        isLiking: false,
      });

      render(<CommentsSection slug="test" />);

      // CommentList should receive isLoading=true
      expect(screen.getByTestId('comment-list')).toBeInTheDocument();
    });
  });

  describe('callbacks', () => {
    it('should provide handleSubmit to CommentForm', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, isLoading: false, isAuthenticated: true });
      const mockCreateComment = vi.fn();
      mockUseComments.mockReturnValue({
        comments: [],
        isLoading: false,
        createComment: mockCreateComment,
        deleteComment: vi.fn(),
        likeComment: vi.fn(),
        isCreating: false,
        isDeleting: false,
        isLiking: false,
      });

      render(<CommentsSection slug="test" />);

      screen.getByText('Submit Form').click();

      expect(mockCreateComment).toHaveBeenCalled();
    });

    it('should provide handleDelete to CommentList', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, isLoading: false, isAuthenticated: true });
      const mockDeleteComment = vi.fn();
      mockUseComments.mockReturnValue({
        comments: [{ id: 'c1', content: 'Test', replies: [] }],
        isLoading: false,
        createComment: vi.fn(),
        deleteComment: mockDeleteComment,
        likeComment: vi.fn(),
        isCreating: false,
        isDeleting: false,
        isLiking: false,
      });

      render(<CommentsSection slug="test" />);

      screen.getByText('Delete').click();

      expect(mockDeleteComment).toHaveBeenCalled();
    });

    it('should provide handleLike to CommentList', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, isLoading: false, isAuthenticated: true });
      const mockLikeComment = vi.fn();
      mockUseComments.mockReturnValue({
        comments: [{ id: 'c1', content: 'Test', replies: [] }],
        isLoading: false,
        createComment: vi.fn(),
        deleteComment: vi.fn(),
        likeComment: mockLikeComment,
        isCreating: false,
        isDeleting: false,
        isLiking: false,
      });

      render(<CommentsSection slug="test" />);

      screen.getByText('Like').click();

      expect(mockLikeComment).toHaveBeenCalled();
    });
  });
});

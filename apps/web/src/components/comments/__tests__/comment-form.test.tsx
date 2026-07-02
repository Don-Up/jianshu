import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CommentForm } from '../comment-form';

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

const mockUser = { id: 'user-1', email: 'a@b.com', username: 'testuser', name: 'Test User', avatar: null, createdAt: new Date() };

describe('CommentForm', () => {
  const onSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('auth gate', () => {
    it('should show login prompt when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({ user: null, isLoading: false, isAuthenticated: false });

      render(<CommentForm onSubmit={onSubmit} />);

      expect(screen.getByText('login')).toBeInTheDocument();
      const loginLink = screen.getByText('login');
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('should NOT show textarea when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({ user: null, isLoading: false, isAuthenticated: false });

      render(<CommentForm onSubmit={onSubmit} />);

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should show form when user is authenticated', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, isLoading: false, isAuthenticated: true });

      render(<CommentForm onSubmit={onSubmit} />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByText('Post Comment')).toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('should call onSubmit with trimmed content when form is submitted', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser, isLoading: false, isAuthenticated: true });
      onSubmit.mockResolvedValueOnce(true);

      render(<CommentForm onSubmit={onSubmit} />);

      const textarea = screen.getByRole('textbox');
      const { fireEvent } = require('@testing-library/react');
      fireEvent.change(textarea, { target: { value: 'This is a comment' } });

      screen.getByText('Post Comment').click();

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith('This is a comment');
      });
    });

    it('should NOT submit empty content', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, isLoading: false, isAuthenticated: true });

      render(<CommentForm onSubmit={onSubmit} />);

      expect(screen.getByText('Post Comment')).toBeDisabled();
    });

    it('should NOT submit whitespace-only content', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, isLoading: false, isAuthenticated: true });

      render(<CommentForm onSubmit={onSubmit} />);

      const textarea = screen.getByRole('textbox');
      const { fireEvent } = require('@testing-library/react');
      fireEvent.change(textarea, { target: { value: '   ' } });

      expect(screen.getByText('Post Comment')).toBeDisabled();
    });

    it('should disable submit button when isSubmitting is true', () => {
      mockUseAuth.mockReturnValue({ user: mockUser, isLoading: false, isAuthenticated: true });

      render(<CommentForm onSubmit={onSubmit} isSubmitting={true} />);

      expect(screen.getByText('Posting...')).toBeDisabled();
    });

    it('should clear textarea after successful submission', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser, isLoading: false, isAuthenticated: true });
      onSubmit.mockResolvedValueOnce(true);

      render(<CommentForm onSubmit={onSubmit} />);

      const textarea = screen.getByRole('textbox');
      const { fireEvent } = require('@testing-library/react');
      fireEvent.change(textarea, { target: { value: 'Comment content' } });

      screen.getByText('Post Comment').click();

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toHaveValue('');
      });
    });

    it('should not clear textarea after failed submission', async () => {
      mockUseAuth.mockReturnValue({ user: mockUser, isLoading: false, isAuthenticated: true });
      onSubmit.mockResolvedValueOnce(false);

      render(<CommentForm onSubmit={onSubmit} />);

      const textarea = screen.getByRole('textbox');
      const { fireEvent } = require('@testing-library/react');
      fireEvent.change(textarea, { target: { value: 'Comment content' } });

      screen.getByText('Post Comment').click();

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toHaveValue('Comment content');
      });
    });
  });
});

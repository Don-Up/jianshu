import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { SearchInput } from '../search-input';
import type { ArticleWithAuthor } from '@/types';

// Mock next/navigation - at top level
const mockRouterPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

// Mock articleApi
vi.mock('@/lib/api', () => ({
  articleApi: {
    list: vi.fn(),
  },
}));

// Mock utils
vi.mock('@/lib/utils', async () => {
  const actual = await import('@/lib/utils');
  return {
    ...actual,
    formatDate: vi.fn(() => '2024-01-01'),
    cn: vi.fn((...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ')),
  };
});

import { articleApi } from '@/lib/api';

const mockArticle: ArticleWithAuthor = {
  id: '1',
  title: 'Test Article Title',
  slug: 'test-article-title',
  content: '<p>Test content</p>',
  excerpt: 'This is a test excerpt',
  coverImage: null,
  author: {
    id: 'author-1',
    email: 'test@example.com',
    username: 'testuser',
    name: 'Test Author',
    bio: null,
    avatar: null,
    createdAt: new Date('2024-01-01'),
  },
  tags: ['test'],
  likeCount: 42,
  commentCount: 10,
  readCount: 100,
  isLiked: false,
  isBookmarked: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockSearch = vi.fn().mockImplementation(() => Promise.resolve({
  success: true,
  data: {
    items: [mockArticle],
    total: 1,
    page: 1,
    limit: 5,
    totalPages: 1,
  },
}));

describe('SearchInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearch.mockClear();
    (articleApi.list as ReturnType<typeof vi.fn>).mockImplementation(mockSearch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should render search input', () => {
      render(<SearchInput />);
      const input = screen.getByPlaceholderText('搜索文章...');
      expect(input).toBeInTheDocument();
    });

    it('should render with default className', () => {
      const { container } = render(<SearchInput />);
      expect(container.firstChild).toHaveClass('relative');
    });

    it('should accept custom className', () => {
      const { container } = render(<SearchInput className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('user input', () => {
    it('should update input value on typing', () => {
      render(<SearchInput />);
      const input = screen.getByPlaceholderText('搜索文章...') as HTMLInputElement;

      fireEvent.change(input, { target: { value: 'test' } });
      expect(input.value).toBe('test');
    });

    it('should not trigger search with single character', async () => {
      render(<SearchInput />);
      const input = screen.getByPlaceholderText('搜索文章...');

      fireEvent.change(input, { target: { value: 'a' } });

      // Wait for potential debounce
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 400));
      });

      expect(articleApi.list).not.toHaveBeenCalled();
    });

    it('should trigger search after 300ms debounce with 2+ characters', async () => {
      (articleApi.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: true,
        data: {
          items: [mockArticle],
          total: 1,
          page: 1,
          limit: 5,
          totalPages: 1,
        },
      });

      render(<SearchInput />);
      const input = screen.getByPlaceholderText('搜索文章...');

      fireEvent.change(input, { target: { value: 'test' } });

      // Advance past debounce time
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 400));
      });

      expect(articleApi.list).toHaveBeenCalledWith({
        search: 'test',
        page: 1,
        limit: 5,
      });
    });
  });

  describe('dropdown display', () => {
    it('should not show dropdown initially', () => {
      render(<SearchInput />);
      expect(screen.queryByText('Test Article Title')).not.toBeInTheDocument();
    });

    it('should show dropdown with results after search', async () => {
      (articleApi.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: true,
        data: {
          items: [mockArticle],
          total: 1,
          page: 1,
          limit: 5,
          totalPages: 1,
        },
      });

      render(<SearchInput />);
      const input = screen.getByPlaceholderText('搜索文章...');

      fireEvent.change(input, { target: { value: 'test' } });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 400));
      });

      await waitFor(() => {
        expect(screen.getByText('Test Article Title')).toBeInTheDocument();
      });
    });

    it('should show article author name in dropdown', async () => {
      (articleApi.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: true,
        data: {
          items: [mockArticle],
          total: 1,
          page: 1,
          limit: 5,
          totalPages: 1,
        },
      });

      render(<SearchInput />);
      const input = screen.getByPlaceholderText('搜索文章...');

      fireEvent.change(input, { target: { value: 'test' } });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 400));
      });

      await waitFor(() => {
        expect(screen.getByText(/Test Author/)).toBeInTheDocument();
      });
    });

    it('should show "未找到相关文章" when no results', async () => {
      (articleApi.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: true,
        data: {
          items: [],
          total: 0,
          page: 1,
          limit: 5,
          totalPages: 1,
        },
      });

      render(<SearchInput />);
      const input = screen.getByPlaceholderText('搜索文章...');

      fireEvent.change(input, { target: { value: 'nonexistent' } });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 400));
      });

      await waitFor(() => {
        expect(screen.getByText('未找到相关文章')).toBeInTheDocument();
      });
    });

    it('should show multiple results in dropdown', async () => {
      const article2 = { ...mockArticle, id: '2', title: 'Second Article' };
      const article3 = { ...mockArticle, id: '3', title: 'Third Article' };

      (articleApi.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: true,
        data: {
          items: [mockArticle, article2, article3],
          total: 3,
          page: 1,
          limit: 5,
          totalPages: 1,
        },
      });

      render(<SearchInput />);
      const input = screen.getByPlaceholderText('搜索文章...');

      fireEvent.change(input, { target: { value: 'test' } });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 400));
      });

      await waitFor(() => {
        expect(screen.getByText('Test Article Title')).toBeInTheDocument();
        expect(screen.getByText('Second Article')).toBeInTheDocument();
        expect(screen.getByText('Third Article')).toBeInTheDocument();
      });
    });
  });

  describe('click result navigation', () => {
    it('should navigate to article on result click', async () => {
      (articleApi.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: true,
        data: {
          items: [mockArticle],
          total: 1,
          page: 1,
          limit: 5,
          totalPages: 1,
        },
      });

      render(<SearchInput />);
      const input = screen.getByPlaceholderText('搜索文章...');

      fireEvent.change(input, { target: { value: 'test' } });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 400));
      });

      await waitFor(() => {
        expect(screen.getByText('Test Article Title')).toBeInTheDocument();
      });

      const resultButton = screen.getByText('Test Article Title').closest('button');
      if (resultButton) {
        fireEvent.click(resultButton);
      }

      expect(mockRouterPush).toHaveBeenCalledWith('/article/test-article-title');
    });
  });

  describe('click outside to close', () => {
    it('should close dropdown when clicking outside', async () => {
      (articleApi.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: true,
        data: {
          items: [mockArticle],
          total: 1,
          page: 1,
          limit: 5,
          totalPages: 1,
        },
      });

      render(<SearchInput />);
      const input = screen.getByPlaceholderText('搜索文章...');

      fireEvent.change(input, { target: { value: 'test' } });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 400));
      });

      await waitFor(() => {
        expect(screen.getByText('Test Article Title')).toBeInTheDocument();
      });

      // Click outside
      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText('Test Article Title')).not.toBeInTheDocument();
      });
    });
  });

  describe('Escape key to close', () => {
    it('should close dropdown on Escape key', async () => {
      (articleApi.list as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: true,
        data: {
          items: [mockArticle],
          total: 1,
          page: 1,
          limit: 5,
          totalPages: 1,
        },
      });

      render(<SearchInput />);
      const input = screen.getByPlaceholderText('搜索文章...');

      fireEvent.change(input, { target: { value: 'test' } });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 400));
      });

      await waitFor(() => {
        expect(screen.getByText('Test Article Title')).toBeInTheDocument();
      });

      // Press Escape
      fireEvent.keyDown(document.body, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByText('Test Article Title')).not.toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('should handle API error gracefully', async () => {
      (articleApi.list as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<SearchInput />);
      const input = screen.getByPlaceholderText('搜索文章...');

      fireEvent.change(input, { target: { value: 'test' } });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 400));
      });

      // Should not show results, dropdown should be closed
      await waitFor(() => {
        expect(screen.queryByText('Test Article Title')).not.toBeInTheDocument();
      });
    });
  });
});
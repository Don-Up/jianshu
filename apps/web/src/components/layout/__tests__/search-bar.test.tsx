import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from '../search-bar';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('SearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render search input', () => {
      render(<SearchBar />);
      const input = screen.getByPlaceholderText('搜索文章...');
      expect(input).toBeInTheDocument();
    });

    it('should render search button', () => {
      render(<SearchBar />);
      const button = screen.getByRole('button', { type: 'submit' });
      expect(button).toBeInTheDocument();
    });

    it('should render with empty initial value', () => {
      render(<SearchBar />);
      const input = screen.getByPlaceholderText('搜索文章...') as HTMLInputElement;
      expect(input.value).toBe('');
    });
  });

  describe('user input', () => {
    it('should update input value on typing', () => {
      render(<SearchBar />);
      const input = screen.getByPlaceholderText('搜索文章...') as HTMLInputElement;

      fireEvent.change(input, { target: { value: 'test query' } });
      expect(input.value).toBe('test query');
    });

    it('should handle multiple character inputs', () => {
      render(<SearchBar />);
      const input = screen.getByPlaceholderText('搜索文章...') as HTMLInputElement;

      fireEvent.change(input, { target: { value: 'react nextjs' } });
      expect(input.value).toBe('react nextjs');
    });
  });

  describe('form submission', () => {
    it('should navigate to search page on submit', () => {
      render(<SearchBar />);
      const input = screen.getByPlaceholderText('搜索文章...');
      const form = input.closest('form')!;

      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.submit(form);

      expect(mockPush).toHaveBeenCalledWith('/search?q=test');
    });

    it('should encode special characters in search query', () => {
      render(<SearchBar />);
      const input = screen.getByPlaceholderText('搜索文章...');
      const form = input.closest('form')!;

      fireEvent.change(input, { target: { value: '测试文章' } });
      fireEvent.submit(form);

      expect(mockPush).toHaveBeenCalledWith('/search?q=%E6%B5%8B%E8%AF%95%E6%96%87%E7%AB%A0');
    });

    it('should trim whitespace from search query', () => {
      render(<SearchBar />);
      const input = screen.getByPlaceholderText('搜索文章...');
      const form = input.closest('form')!;

      fireEvent.change(input, { target: { value: '  test  ' } });
      fireEvent.submit(form);

      expect(mockPush).toHaveBeenCalledWith('/search?q=test');
    });

    it('should not navigate with empty query', () => {
      render(<SearchBar />);
      const input = screen.getByPlaceholderText('搜索文章...');
      const form = input.closest('form')!;

      fireEvent.change(input, { target: { value: '' } });
      fireEvent.submit(form);

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should not navigate with whitespace-only query', () => {
      render(<SearchBar />);
      const input = screen.getByPlaceholderText('搜索文章...');
      const form = input.closest('form')!;

      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.submit(form);

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('keyboard submission', () => {
    it('should submit on Enter key', () => {
      render(<SearchBar />);
      const input = screen.getByPlaceholderText('搜索文章...');

      fireEvent.change(input, { target: { value: 'enter test' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockPush).toHaveBeenCalledWith('/search?q=enter%20test');
    });

    it('should not submit on other keys', () => {
      render(<SearchBar />);
      const input = screen.getByPlaceholderText('搜索文章...');

      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('input clearing', () => {
    it('should keep input value after successful submission (actual behavior)', () => {
      render(<SearchBar />);
      const input = screen.getByPlaceholderText('搜索文章...') as HTMLInputElement;
      const form = input.closest('form')!;

      fireEvent.change(input, { target: { value: 'clear test' } });
      fireEvent.submit(form);

      // Note: Current SearchBar does not clear input after submission
      // This test documents actual behavior
      expect(input.value).toBe('clear test');
    });
  });
});
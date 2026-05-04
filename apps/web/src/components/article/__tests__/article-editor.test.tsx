import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ArticleEditor } from '../article-editor';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock articleApi
vi.mock('@/lib/api', () => ({
  articleApi: {
    create: vi.fn().mockResolvedValue({
      success: true,
      data: {
        id: '1',
        title: 'Test Article',
        slug: 'test-article',
        content: '<p>Content</p>',
        author: {},
      },
    }),
    update: vi.fn().mockResolvedValue({
      success: true,
      data: {
        id: '1',
        title: 'Test Article',
        slug: 'test-article',
        content: '<p>Content</p>',
        author: {},
      },
    }),
  },
}));

// Mock Button
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    type,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    type?: 'button' | 'submit';
  }) => (
    <button type={type || 'button'} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

// Mock Input
vi.mock('@/components/ui/input', () => ({
  Input: ({
    value,
    onChange,
    placeholder,
    type,
    className,
  }: {
    value?: string;
    onChange?: () => void;
    placeholder?: string;
    type?: string;
    className?: string;
  }) => (
    <input
      type={type || 'text'}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
    />
  ),
}));

// Mock Textarea
vi.mock('@/components/ui/textarea', () => ({
  Textarea: ({
    value,
    onChange,
    placeholder,
    className,
  }: {
    value?: string;
    onChange?: () => void;
    placeholder?: string;
    className?: string;
  }) => (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
    />
  ),
}));

// Mock Card components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardFooter: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

describe('ArticleEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create mode', () => {
    it('should render empty form for new article', () => {
      render(<ArticleEditor />);

      const titleInput = screen.getByPlaceholderText('输入文章标题...') as HTMLInputElement;
      expect(titleInput.value).toBe('');
    });

    it('should render all form fields', () => {
      render(<ArticleEditor />);

      expect(screen.getByPlaceholderText('输入文章标题...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('封面图片 URL（可选）')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('输入文章内容...（支持 Markdown）')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('文章摘要...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('技术, 随笔, 读书...')).toBeInTheDocument();
    });

    it('should have Publish and Save Draft buttons', () => {
      render(<ArticleEditor />);

      expect(screen.getByText('发布')).toBeInTheDocument();
      expect(screen.getByText('保存草稿')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
    });

    it('should update title on change', async () => {
      render(<ArticleEditor />);

      const titleInput = screen.getByPlaceholderText('输入文章标题...');
      await userEvent.type(titleInput, 'My Article Title');

      expect(titleInput).toHaveValue('My Article Title');
    });

    it('should update content on change', async () => {
      render(<ArticleEditor />);

      const contentTextarea = screen.getByPlaceholderText('输入文章内容...（支持 Markdown）');
      await userEvent.type(contentTextarea, 'This is the article content');

      expect(contentTextarea).toHaveValue('This is the article content');
    });

    it('should update tags on change', async () => {
      render(<ArticleEditor />);

      const tagsInput = screen.getByPlaceholderText('技术, 随笔, 读书...');
      await userEvent.type(tagsInput, 'tech, life');

      expect(tagsInput).toHaveValue('tech, life');
    });
  });

  describe('Edit mode', () => {
    const initialData = {
      title: 'Existing Title',
      content: 'Existing content',
      excerpt: 'Existing excerpt',
      tags: ['tag1', 'tag2'],
      coverImage: 'https://example.com/cover.jpg',
    };

    it('should pre-fill form with initial data', () => {
      render(<ArticleEditor initialData={initialData} slug="existing-slug" isEditing={true} />);

      const titleInput = screen.getByPlaceholderText('输入文章标题...') as HTMLInputElement;
      expect(titleInput.value).toBe('Existing Title');
    });

    it('should display correct content in textarea', () => {
      render(<ArticleEditor initialData={initialData} slug="existing-slug" isEditing={true} />);

      const contentTextarea = screen.getByPlaceholderText('输入文章内容...（支持 Markdown）');
      expect(contentTextarea).toHaveValue('Existing content');
    });

    it('should pre-fill tags as comma-separated string', () => {
      render(<ArticleEditor initialData={initialData} slug="existing-slug" isEditing={true} />);

      const tagsInput = screen.getByPlaceholderText('技术, 随笔, 读书...');
      expect(tagsInput).toHaveValue('tag1, tag2');
    });
  });

  describe('Form submission', () => {
    it('should disable buttons while submitting', async () => {
      const { articleApi } = await import('@/lib/api');
      // Make the API call hang
      articleApi.create.mockImplementation(() => new Promise(() => {}));

      render(<ArticleEditor />);

      const titleInput = screen.getByPlaceholderText('输入文章标题...');
      await userEvent.type(titleInput, 'My Article');

      const contentTextarea = screen.getByPlaceholderText('输入文章内容...（支持 Markdown）');
      await userEvent.type(contentTextarea, 'Content');

      const submitButton = screen.getByText('发布');
      await userEvent.click(submitButton);

      expect(screen.getByText('发布中...')).toBeInTheDocument();
    });
  });
});
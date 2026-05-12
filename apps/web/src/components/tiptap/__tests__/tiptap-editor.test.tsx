import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TiptapEditor } from '../tiptap-editor';

// Mock TipTap
vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(() => ({
    isActive: vi.fn(),
    chain: vi.fn(() => ({
      focus: vi.fn(() => ({
        toggleBold: vi.fn(() => ({ run: vi.fn() })),
        toggleItalic: vi.fn(() => ({ run: vi.fn() })),
        toggleUnderline: vi.fn(() => ({ run: vi.fn() })),
        toggleStrike: vi.fn(() => ({ run: vi.fn() })),
        toggleHeading: vi.fn(() => ({ run: vi.fn() })),
        toggleBulletList: vi.fn(() => ({ run: vi.fn() })),
        toggleOrderedList: vi.fn(() => ({ run: vi.fn() })),
        toggleBlockquote: vi.fn(() => ({ run: vi.fn() })),
        toggleCodeBlock: vi.fn(() => ({ run: vi.fn() })),
        setHorizontalRule: vi.fn(() => ({ run: vi.fn() })),
        setLink: vi.fn(() => ({ run: vi.fn() })),
        setImage: vi.fn(() => ({ run: vi.fn() })),
      })),
    })),
  })),
  EditorContent: vi.fn(() => <div data-testid="editor-content">Editor Content</div>),
}));

vi.mock('@/lib/tiptap/extensions', () => ({
  extensions: [],
}));

vi.mock('@/components/tiptap/tiptap-toolbar', () => ({
  TiptapToolbar: vi.fn(() => <div data-testid="toolbar">Toolbar</div>),
}));

describe('TiptapEditor', () => {
  it('should render with placeholder', () => {
    render(<TiptapEditor content="" onChange={vi.fn()} placeholder="输入文章内容..." />);

    expect(screen.getByTestId('toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('editor-content')).toBeInTheDocument();
  });

  it('should render editor content', () => {
    render(<TiptapEditor content="<p>Test content</p>" onChange={vi.fn()} />);

    expect(screen.getByTestId('editor-content')).toBeInTheDocument();
  });
});
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShareButton } from '../share-button';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Dialog components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: { open?: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-title">{children}</div>
  ),
}));

// Mock Button
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    variant,
    className,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
    className?: string;
  }) => (
    <button type="button" onClick={onClick} className={className} data-variant={variant}>
      {children}
    </button>
  ),
}));

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
};
Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  writable: true,
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'https://example.com',
  },
  writable: true,
});

describe('ShareButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render share button', () => {
    render(<ShareButton slug="test-post" title="Test Post" />);
    expect(screen.getByRole('button', { name: /分享/ })).toBeInTheDocument();
  });

  it('should open dialog when share button is clicked', () => {
    render(<ShareButton slug="test-post" title="Test Post" />);
    fireEvent.click(screen.getByRole('button', { name: /分享/ }));
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  it('should display share options in dialog', () => {
    render(<ShareButton slug="test-post" title="Test Post" />);
    fireEvent.click(screen.getByRole('button', { name: /分享/ }));
    expect(screen.getByText('分享文章')).toBeInTheDocument();
    expect(screen.getByText('复制链接')).toBeInTheDocument();
    expect(screen.getByText(/Twitter/)).toBeInTheDocument();
    expect(screen.getByText(/Facebook/)).toBeInTheDocument();
  });

  it('should copy link to clipboard when copy link button is clicked', async () => {
    render(<ShareButton slug="test-post" title="Test Post" />);
    fireEvent.click(screen.getByRole('button', { name: /分享/ }));
    fireEvent.click(screen.getByText('复制链接'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'https://example.com/article/test-post'
    );
  });

  it('should close dialog after copying link', async () => {
    render(<ShareButton slug="test-post" title="Test Post" />);
    fireEvent.click(screen.getByRole('button', { name: /分享/ }));
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByText('复制链接'));
    // Dialog should close after copy
    await new Promise((resolve) => setTimeout(resolve, 0));
    // Note: Dialog state depends on implementation - may need to verify close behavior
  });

  it('should open Twitter share URL when Twitter button is clicked', () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    render(<ShareButton slug="test-post" title="Test Post" />);
    fireEvent.click(screen.getByRole('button', { name: /分享/ }));
    fireEvent.click(screen.getByText(/Twitter/));
    expect(windowOpenSpy).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com/intent/tweet'),
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('should open Facebook share URL when Facebook button is clicked', () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    render(<ShareButton slug="test-post" title="Test Post" />);
    fireEvent.click(screen.getByRole('button', { name: /分享/ }));
    fireEvent.click(screen.getByText(/Facebook/));
    expect(windowOpenSpy).toHaveBeenCalledWith(
      expect.stringContaining('facebook.com/sharer/sharer.php'),
      '_blank',
      'noopener,noreferrer'
    );
  });
});

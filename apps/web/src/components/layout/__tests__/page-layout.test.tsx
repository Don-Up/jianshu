import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageLayout } from '../page-layout';
import { Header } from '../header';
import { Footer } from '../footer';

// Mock child components
vi.mock('../header', () => ({
  Header: vi.fn(() => <div data-testid="header">Header</div>),
}));

vi.mock('../footer', () => ({
  Footer: vi.fn(() => <div data-testid="footer">Footer</div>),
}));

describe('PageLayout', () => {
  it('should render Header and Footer by default', () => {
    render(<PageLayout>Content</PageLayout>);

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('should render children in main element', () => {
    render(<PageLayout>Test Content</PageLayout>);

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render without footer when showFooter is false', () => {
    render(<PageLayout showFooter={false}>Content</PageLayout>);

    expect(screen.queryByTestId('footer')).not.toBeInTheDocument();
  });

  it('should render with footer when showFooter is true', () => {
    render(<PageLayout showFooter={true}>Content</PageLayout>);

    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../error-boundary';

// Mock console.error to prevent error output during tests
const mockConsoleError = vi.spyOn(console, 'error').mockReturnValue();

describe('ErrorBoundary', () => {
  afterEach(() => {
    mockConsoleError.mockClear();
  });

  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <div>正常内容</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('正常内容')).toBeInTheDocument();
  });

  it('should display error message when error occurs', () => {
    const ErrorComponent = () => {
      throw new Error('测试错误');
    };

    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('出错了')).toBeInTheDocument();
  });

  it('should display retry button when error occurs', () => {
    const ErrorComponent = () => {
      throw new Error('测试错误');
    };

    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('刷新页面')).toBeInTheDocument();
  });

  it('should have button to reload page', () => {
    const ErrorComponent = () => {
      throw new Error('测试错误');
    };

    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );

    const button = screen.getByRole('button', { name: '刷新页面' });
    expect(button).toBeInTheDocument();
  });
});

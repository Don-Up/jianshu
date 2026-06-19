'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
        <svg
          className="w-8 h-8 text-destructive"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">出错了</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        抱歉，页面加载时遇到了问题。请尝试刷新页面。
      </p>
      {process.env.NODE_ENV === 'development' && error?.message && (
        <div className="mb-6 p-4 bg-muted rounded-md text-left w-full max-w-md">
          <p className="text-sm font-mono text-destructive break-all">
            {error.message}
          </p>
        </div>
      )}
      <div className="flex gap-4">
        <Button onClick={() => reset()} variant="default">
          重试
        </Button>
        <Button onClick={() => window.location.href = '/'} variant="outline">
          返回首页
        </Button>
      </div>
    </div>
  );
}

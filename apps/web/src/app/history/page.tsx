'use client';

import { useState } from 'react';
import { PageLayout } from '@/components/layout/page-layout';
import { HistoryList } from '@/components/history/history-list';
import { useHistory } from '@/hooks/use-history';
import { Button } from '@/components/ui/button';

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const { history, isLoading, total, totalPages, removeItem, clearAll, isRemoving } = useHistory(page);

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">阅读历史</h1>
          {history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              disabled={isRemoving}
              className="text-muted-foreground"
            >
              清空全部
            </Button>
          )}
        </div>

        <HistoryList
          items={history}
          isLoading={isLoading}
          onRemoveItem={removeItem}
        />

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={page === 1 || isLoading}
            >
              首页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              上一页
            </Button>
            <span className="flex items-center text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
            >
              下一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages || isLoading}
            >
              尾页
            </Button>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

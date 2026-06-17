'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageLayout } from '@/components/layout/page-layout';
import { ArticleList } from '@/components/article/article-list';
import { Button } from '@/components/ui/button';
import { useSearch } from '@/hooks/use-search';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const { articles, isLoading, error, hasMore, loadMore } = useSearch(query);

  if (!query) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">请输入搜索关键词</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">搜索失败: {error}</p>
      </div>
    );
  }

  if (!isLoading && articles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">没有找到相关文章</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ArticleList articles={articles} isLoading={isLoading} />
      {hasMore && (
        <div className="py-4 text-center">
          <Button variant="outline" onClick={loadMore} disabled={isLoading}>
            {isLoading ? '加载中...' : '加载更多'}
          </Button>
        </div>
      )}
    </div>
  );
}

function SearchFallback() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="h-40 bg-muted rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export default function SearchPage() {
  return (
    <PageLayout>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">搜索结果</h1>
        </div>
        <Suspense fallback={<SearchFallback />}>
          <SearchContent />
        </Suspense>
      </div>
    </PageLayout>
  );
}
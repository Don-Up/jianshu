'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageLayout } from '@/components/layout/page-layout';
import { ArticleList } from '@/components/article/article-list';
import { ArticleListSkeleton } from '@/components/loading/skeleton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { feedApi, articleApi } from '@/lib/api';
import type { ArticleWithAuthor } from '@/types';

export default function Home() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const { user, isAuthenticated } = useAuth();

  // Use home feed for logged-in users, recommended feed for anonymous
  // Include user?.id in queryKey so React Query refetches when user changes
  const { data, isLoading } = useQuery({
    queryKey: [
      isAuthenticated ? 'feed' : 'articles',
      isAuthenticated ? 'home' : 'list',
      user?.id || 'anonymous',
      page,
      limit,
    ],
    queryFn: () =>
      isAuthenticated
        ? feedApi.getHomeFeed({ page, limit })
        : articleApi.list({ page, limit }),
    enabled: true,
  });

  const articles = data?.data?.items || [];
  const totalPages = data?.data?.totalPages || 0;

  return (
    <PageLayout>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            {isAuthenticated ? '关注' : '发现'}
          </h1>
        </div>
        {isLoading ? (
          <ArticleListSkeleton count={5} />
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {isAuthenticated ? '还没有关注内容' : '暂无文章'}
            </p>
            {!isAuthenticated && (
              <p className="text-sm text-muted-foreground mt-1">登录后查看更多内容</p>
            )}
          </div>
        ) : (
          <ArticleList articles={articles} />
        )}

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

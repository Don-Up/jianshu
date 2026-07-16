'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PageLayout } from '@/components/layout/page-layout';
import { ArticleList } from '@/components/article/article-list';
import { ArticleListSkeleton } from '@/components/loading/skeleton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { feedApi, articleApi } from '@/lib/api';

function HomeContent() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const { user, isAuthenticated } = useAuth();

  // Determine which feed to show based on tab param
  // 'following' tab shows home feed (articles from followed users) for logged in users
  // 'discover' tab or default shows general articles
  const showFollowing = tab === 'following' && isAuthenticated;

  const { data, isLoading } = useQuery({
    queryKey: [showFollowing ? 'feed' : 'articles', showFollowing ? 'home' : 'list', user?.id || 'anonymous', page, limit],
    queryFn: () =>
      showFollowing
        ? feedApi.getHomeFeed({ page, limit })
        : articleApi.list({ page, limit }),
    enabled: true,
  });

  const articles = data?.data?.items || [];
  const totalPages = data?.data?.totalPages || 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          {showFollowing ? '关注' : '发现'}
        </h1>
      </div>
      {isLoading ? (
        <ArticleListSkeleton count={5} />
      ) : articles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {showFollowing ? '还没有关注内容' : '暂无文章'}
          </p>
          {!showFollowing && (
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
  );
}

export default function Home() {
  return (
    <PageLayout>
      <Suspense fallback={<div className="max-w-5xl mx-auto px-4 py-8"><ArticleListSkeleton count={5} /></div>}>
        <HomeContent />
      </Suspense>
    </PageLayout>
  );
}
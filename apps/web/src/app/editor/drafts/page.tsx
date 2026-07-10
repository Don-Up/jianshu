'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useDrafts } from '@/hooks/use-drafts';
import { formatDate } from '@/lib/utils';

export default function DraftsPage() {
  const [page, setPage] = useState(1);
  const router = useRouter();
  const { drafts, isLoading, totalPages, publishDraft, deleteDraft, isPending } = useDrafts(page);

  const handlePublish = (slug: string) => {
    publishDraft(slug);
    router.push(`/article/${slug}`);
  };

  const handleDelete = (slug: string) => {
    if (window.confirm('确定要删除这个草稿吗？')) {
      deleteDraft(slug);
    }
  };

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">我的草稿</h1>
          <Link href="/write">
            <Button size="sm">写文章</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-gray-100 rounded-lg" />
              </div>
            ))}
          </div>
        ) : drafts.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto text-muted-foreground mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-muted-foreground">还没有草稿</p>
            <p className="text-sm text-muted-foreground mt-1">开始写作吧</p>
          </div>
        ) : (
          <div className="space-y-4">
            {drafts.map((draft) => (
              <Card key={draft.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold text-foreground mb-2 line-clamp-1">
                        {draft.title || '无标题'}
                      </h2>
                      {draft.excerpt && (
                        <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                          {draft.excerpt}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        最后更新于 {formatDate(draft.updatedAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handlePublish(draft.slug)}
                        disabled={isPending}
                      >
                        发布
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/write?slug=${draft.slug}`)}
                      >
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(draft.slug)}
                        disabled={isPending}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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

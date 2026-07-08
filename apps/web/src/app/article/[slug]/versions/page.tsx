'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageLayout } from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { VersionHistory } from '@/components/article/version-history';
import { useArticleVersions } from '@/hooks/use-article-versions';
import { useArticle } from '@/hooks/use-article';
import { useAuth } from '@/hooks/use-auth';
import type { ArticleVersion } from '@/lib/api';

export default function ArticleVersionsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { article, isLoading: isArticleLoading } = useArticle(slug);
  const { user, isLoading: isAuthLoading } = useAuth();
  const { versions, isLoading, restoreVersion, isRestoring } = useArticleVersions(slug);
  const [restoringVersion, setRestoringVersion] = useState<string | null>(null);

  const isOwner = user && article && user.id === article.author.id;

  const handleRestore = (version: ArticleVersion) => {
    if (confirm(`确定要恢复到版本 ${version.version} 吗？`)) {
      setRestoringVersion(version.id);
      restoreVersion(version.id, {
        onSuccess: () => {
          router.push(`/article/${slug}`);
        },
        onSettled: () => {
          setRestoringVersion(null);
        },
      });
    }
  };

  const isLoadingOverall = isArticleLoading || isAuthLoading;

  if (isLoadingOverall && !article) {
    return (
      <PageLayout>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-1/4" />
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!article) {
    return (
      <PageLayout>
        <div className="max-w-3xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">文章不存在</h1>
          <Button asChild>
            <Link href="/">返回首页</Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href={`/article/${slug}`} className="hover:text-foreground">
              {article.title}
            </Link>
            <span>/</span>
            <span>版本历史</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">版本历史</h1>
          {article && (
            <p className="text-muted-foreground mt-1">
              共 {versions.length} 个版本
            </p>
          )}
        </div>

        <VersionHistory
          versions={versions}
          currentVersion={versions.length > 0 ? versions[0].version : undefined}
          isLoading={isLoading}
          onRestore={isOwner ? handleRestore : undefined}
          isRestoring={isRestoring}
        />
      </div>
    </PageLayout>
  );
}

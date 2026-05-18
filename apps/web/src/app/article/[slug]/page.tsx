'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageLayout } from '@/components/layout/page-layout';
import { ArticleContent } from '@/components/article/article-content';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useArticle } from '@/hooks/use-article';
import { useAuth } from '@/hooks/use-auth';

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { article, isLoading: isArticleLoading, error, likeArticle } = useArticle(slug);
  const [isLiking, setIsLiking] = useState(false);
  const { user, isLoading: isAuthLoading } = useAuth();

  const handleLike = async () => {
    setIsLiking(true);
    try {
      await likeArticle();
    } finally {
      setIsLiking(false);
    }
  };

  const isLoading = isArticleLoading || isAuthLoading;

  if (isLoading && !article) {
    return (
      <PageLayout>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded w-3/4" />
            <div className="h-6 bg-muted rounded w-1/4" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !article) {
    return (
      <PageLayout>
        <div className="max-w-3xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">文章不存在</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.history.back()}>返回</Button>
        </div>
      </PageLayout>
    );
  }

  console.log('isLoading:', isLoading, 'article.author.id:', article?.author?.id, 'user?.id:', user?.id, 'user object:', user);

  return (
    <PageLayout>
      <div className="bg-secondary/30 py-8">
        <ArticleContent
          article={article}
          onLike={handleLike}
          isLiking={isLiking}
          showEditButton={!isLoading && user !== null && article.author.id === user.id}
          onEdit={() => router.push(`/write?slug=${slug}`)}
        />
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-bold text-foreground mb-4">评论</h3>
            <p className="text-muted-foreground text-sm">评论功能开发中...</p>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
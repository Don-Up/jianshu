'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageLayout } from '@/components/layout/page-layout';
import { ArticleContent } from '@/components/article/article-content';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArticleEditorSkeleton } from '@/components/loading/skeleton';
import { useArticle } from '@/hooks/use-article';
import { useAuth } from '@/hooks/use-auth';
import { CommentsSection } from '@/components/comments/comments-section';
import { AddToCollectionModal } from '@/components/collections/add-to-collection-modal';

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { article, isLoading: isArticleLoading, error, likeArticle } = useArticle(slug);
  const [isLiking, setIsLiking] = useState(false);
  const { user, isLoading: isAuthLoading } = useAuth();
  const [showCollectionModal, setShowCollectionModal] = useState(false);

  const isOwner = !!(user && article && user.id === article.author.id);

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
        <div className="bg-secondary/30 py-8">
          <ArticleEditorSkeleton />
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

  return (
    <PageLayout>
      <div className="bg-secondary/30 py-8">
        <ArticleContent
          article={article}
          onLike={handleLike}
          isLiking={isLiking}
          showEditButton={isOwner}
          onEdit={() => router.push(`/write?slug=${slug}`)}
          headerActions={
            <>
              {user && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCollectionModal(true)}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  收藏
                </Button>
              )}
              {isOwner && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/article/${slug}/versions`}>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    版本
                  </Link>
                </Button>
              )}
            </>
          }
        />
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-bold text-foreground mb-4">评论</h3>
            <CommentsSection slug={article.slug} />
          </CardContent>
        </Card>
      </div>

      <AddToCollectionModal
        open={showCollectionModal}
        onOpenChange={setShowCollectionModal}
        articleSlug={article.slug}
      />
    </PageLayout>
  );
}
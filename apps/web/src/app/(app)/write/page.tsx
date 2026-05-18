'use client';

import { useState } from 'react';
import { PageLayout } from '@/components/layout/page-layout';
import { ArticleEditor } from '@/components/article/article-editor';
import { useSearchParams } from 'next/navigation';
import { useArticle } from '@/hooks/use-article';
import { useEffect } from 'react';

function WritePageContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug');
  const { article, isLoading } = useArticle(slug || '');
  const [initialData, setInitialData] = useState<any>({});

  useEffect(() => {
    if (article) {
      setInitialData({
        title: article.title,
        content: article.content,
        excerpt: article.excerpt || '',
        coverImage: article.coverImage || '',
        tags: article.tags || [],
      });
    }
  }, [article]);

  if (isLoading && slug) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-3/4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <ArticleEditor
      initialData={initialData}
      slug={slug || undefined}
      isEditing={!!slug}
    />
  );
}

export default function WritePage() {
  return (
    <PageLayout>
      <div className="bg-secondary/30 min-h-screen py-8">
        <WritePageContent />
      </div>
    </PageLayout>
  );
}
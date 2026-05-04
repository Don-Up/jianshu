'use client';

import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/page-layout';
import { ArticleList } from '@/components/article/article-list';
import { articleApi } from '@/lib/api';
import type { ArticleWithAuthor } from '@/types';

export default function Home() {
  const [articles, setArticles] = useState<ArticleWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await articleApi.list({ page: 1, limit: 20 });
        setArticles(res.data?.items || []);
      } catch (error) {
        console.error('Failed to fetch articles:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchArticles();
  }, []);

  return (
    <PageLayout>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">发现</h1>
        </div>
        <ArticleList articles={articles} isLoading={isLoading} />
      </div>
    </PageLayout>
  );
}
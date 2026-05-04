'use client';

import { useState, useEffect, useCallback } from 'react';
import { articleApi } from '@/lib/api';
import type { ArticleWithAuthor } from '@/types';

export function useArticle(slug: string) {
  const [article, setArticle] = useState<ArticleWithAuthor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticle = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await articleApi.getBySlug(slug);
      if (res.success && res.data) {
        setArticle(res.data);
      } else {
        setError('Article not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load article');
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  const likeArticle = useCallback(async () => {
    if (!article) return;
    try {
      const res = await articleApi.like(slug);
      if (res.success && res.data) {
        setArticle((prev) =>
          prev ? { ...prev, likeCount: res.data!.likeCount, isLiked: !prev.isLiked } : null
        );
      }
    } catch (err) {
      console.error('Failed to like article:', err);
    }
  }, [slug, article]);

  return { article, isLoading, error, likeArticle, refetch: fetchArticle };
}
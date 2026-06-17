'use client';

import { useState, useCallback, useEffect } from 'react';
import { articleApi } from '@/lib/api';
import type { ArticleWithAuthor } from '@/types';

interface UseSearchResult {
  articles: ArticleWithAuthor[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

export function useSearch(query: string): UseSearchResult {
  const [articles, setArticles] = useState<ArticleWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadResults = useCallback(async (searchQuery: string, pageNum: number = 1) => {
    if (!searchQuery?.trim()) {
      setArticles([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await articleApi.list({ search: searchQuery, page: pageNum, limit: 20 });
      if (res.success && res.data) {
        if (pageNum === 1) {
          setArticles(res.data.items);
        } else {
          setArticles((prev) => [...prev, ...res.data!.items]);
        }
        setTotalPages(res.data.totalPages);
        setHasMore(pageNum < res.data.totalPages);
        setPage(pageNum);
      } else {
        setError(res.error || 'Search failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Re-fetch when query changes (page 1 = replace)
  useEffect(() => {
    if (query?.trim()) {
      loadResults(query, 1);
    } else {
      setArticles([]);
    }
  }, [query, loadResults]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || page >= totalPages) return;
    await loadResults(query, page + 1);
  }, [hasMore, isLoading, page, totalPages, query, loadResults]);

  return { articles, isLoading, error, hasMore, loadMore };
}
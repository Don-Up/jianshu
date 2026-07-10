'use client';

import { useState, useCallback, useEffect } from 'react';
import { articleApi } from '@/lib/api';
import type { ArticleWithAuthor } from '@/types';

export type SortOption = 'relevance' | 'date';
export type DateRange = 'all' | 'day' | 'week' | 'month' | 'year';

interface UseSearchResult {
  articles: ArticleWithAuthor[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  sortBy: SortOption;
  dateRange: DateRange;
  setSortBy: (sort: SortOption) => void;
  setDateRange: (range: DateRange) => void;
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

const RECENT_SEARCHES_KEY = 'jianshu_recent_searches';
const MAX_RECENT_SEARCHES = 10;

function getDateRangeFilter(dateRange: DateRange): string | undefined {
  if (dateRange === 'all') return undefined;

  const now = new Date();
  const ranges: Record<DateRange, number> = {
    all: 0,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000,
  };

  const date = new Date(now.getTime() - ranges[dateRange]);
  return date.toISOString();
}

export function useSearch(query: string): UseSearchResult {
  const [articles, setArticles] = useState<ArticleWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored));
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, []);

  // Add to recent searches
  const addRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== searchQuery);
      const updated = [searchQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  const loadResults = useCallback(async (searchQuery: string, pageNum: number = 1) => {
    if (!searchQuery?.trim()) {
      setArticles([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const createdAfter = getDateRangeFilter(dateRange);

      const res = await articleApi.list({
        search: searchQuery,
        page: pageNum,
        limit: 20,
        ...(createdAfter && { createdAfter }),
      });

      if (res.success && res.data) {
        if (pageNum === 1) {
          setArticles(res.data.items);
        } else {
          setArticles((prev) => [...prev, ...res.data!.items]);
        }
        setTotalPages(res.data.totalPages);
        setHasMore(pageNum < res.data.totalPages);
        setPage(pageNum);

        // Add to recent searches on first page
        if (pageNum === 1) {
          addRecentSearch(searchQuery);
        }
      } else {
        setError(res.error || 'Search failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, addRecentSearch]);

  // Re-fetch when query, sort, or dateRange changes (page 1 = replace)
  useEffect(() => {
    if (query?.trim()) {
      loadResults(query, 1);
    } else {
      setArticles([]);
    }
  }, [query, sortBy, dateRange, loadResults]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || page >= totalPages) return;
    await loadResults(query, page + 1);
  }, [hasMore, isLoading, page, totalPages, query, loadResults]);

  return {
    articles,
    isLoading,
    error,
    hasMore,
    loadMore,
    sortBy,
    dateRange,
    setSortBy,
    setDateRange,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
  };
}

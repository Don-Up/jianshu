'use client';

import { useQuery } from '@tanstack/react-query';
import { feedApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { ArticleWithAuthor } from '@/types';

interface UseFeedResult {
  articles: ArticleWithAuthor[];
  isLoading: boolean;
  error: Error | null;
  total: number;
  page: number;
  totalPages: number;
}

export function useHomeFeed(page: number = 1, limit: number = 10): UseFeedResult {
  const { data, isLoading, error } = useQuery({
    queryKey: [...queryKeys.homeFeed(), page, limit],
    queryFn: () => feedApi.getHomeFeed({ page, limit }),
  });

  return {
    articles: data?.data?.items || [],
    isLoading,
    error: error as Error | null,
    total: data?.data?.total || 0,
    page: data?.data?.page || 1,
    totalPages: data?.data?.totalPages || 0,
  };
}

export function useRecommendedFeed(page: number = 1, limit: number = 10): UseFeedResult {
  const { data, isLoading, error } = useQuery({
    queryKey: [...queryKeys.recommendedFeed(), page, limit],
    queryFn: () => feedApi.getRecommendedFeed({ page, limit }),
  });

  return {
    articles: data?.data?.items || [],
    isLoading,
    error: error as Error | null,
    total: data?.data?.total || 0,
    page: data?.data?.page || 1,
    totalPages: data?.data?.totalPages || 0,
  };
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { articleApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { ArticleWithAuthor } from '@/types';
import type { CreateArticleRequest } from '@jianshu/shared';

export function useArticle(slug: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.article(slug),
    queryFn: () => articleApi.getBySlug(slug),
    enabled: !!slug,
  });

  const likeMutation = useMutation({
    mutationFn: () => articleApi.like(slug),
    onSuccess: (res) => {
      if (res.success && res.data) {
        // Update article in cache with new like count
        queryClient.setQueryData<{ success: boolean; data: ArticleWithAuthor }>(
          queryKeys.article(slug),
          (old) => {
            if (old?.data) {
              return {
                ...old,
                data: {
                  ...old.data,
                  likeCount: res.data!.likeCount,
                  isLiked: !old.data.isLiked,
                },
              };
            }
            return old;
          }
        );
      }
    },
  });

  return {
    article: query.data?.data ?? null,
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    likeArticle: likeMutation.mutate,
    isLiking: likeMutation.isPending,
    refetch: query.refetch,
  };
}

export function useArticleList(params?: { page?: number; limit?: number; search?: string }) {
  const query = useQuery({
    queryKey: [...queryKeys.articles, params] as const,
    queryFn: () => articleApi.list(params as any),
  });

  return {
    articles: query.data?.data?.items ?? [],
    total: query.data?.data?.total ?? 0,
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}

export function useCreateArticle() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CreateArticleRequest) => articleApi.create(data),
    onSuccess: () => {
      // Invalidate articles list when new article is created
      queryClient.invalidateQueries({ queryKey: queryKeys.articles });
    },
  });

  return {
    createArticle: mutation.mutate,
    isCreating: mutation.isPending,
    error: mutation.error?.message ?? null,
  };
}

export function useUpdateArticle(slug: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: Partial<CreateArticleRequest>) => articleApi.update(slug, data),
    onSuccess: () => {
      // Invalidate both the specific article and the articles list
      queryClient.invalidateQueries({ queryKey: queryKeys.article(slug) });
      queryClient.invalidateQueries({ queryKey: queryKeys.articles });
    },
  });

  return {
    updateArticle: mutation.mutate,
    isUpdating: mutation.isPending,
    error: mutation.error?.message ?? null,
  };
}

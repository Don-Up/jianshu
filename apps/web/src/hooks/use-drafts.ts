'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { draftsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { ArticleWithAuthor } from '@/types';

interface UseDraftsResult {
  drafts: ArticleWithAuthor[];
  isLoading: boolean;
  error: Error | null;
  total: number;
  page: number;
  totalPages: number;
  publishDraft: (slug: string) => void;
  deleteDraft: (slug: string) => void;
  isPending: boolean;
}

export function useDrafts(page: number = 1, limit: number = 10): UseDraftsResult {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: [...queryKeys.drafts, page, limit],
    queryFn: () => draftsApi.list({ page, limit }),
  });

  const publishMutation = useMutation({
    mutationFn: (slug: string) => draftsApi.publish(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drafts });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => draftsApi.delete(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drafts });
    },
  });

  return {
    drafts: data?.data?.items || [],
    isLoading,
    error: error as Error | null,
    total: data?.data?.total || 0,
    page: data?.data?.page || 1,
    totalPages: data?.data?.totalPages || 0,
    publishDraft: (slug: string) => publishMutation.mutate(slug),
    deleteDraft: (slug: string) => deleteMutation.mutate(slug),
    isPending: publishMutation.isPending || deleteMutation.isPending,
  };
}

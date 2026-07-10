'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { historyApi, HistoryItem } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { PaginatedResponse } from '@jianshu/shared';

interface UseHistoryResult {
  history: HistoryItem[];
  isLoading: boolean;
  error: Error | null;
  total: number;
  page: number;
  totalPages: number;
  removeItem: (articleId: string) => void;
  clearAll: () => void;
  isRemoving: boolean;
}

export function useHistory(page: number = 1, limit: number = 10): UseHistoryResult {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: [...queryKeys.history, page, limit],
    queryFn: () => historyApi.getHistory({ page, limit }),
  });

  const removeMutation = useMutation({
    mutationFn: (articleId: string) => historyApi.removeFromHistory(articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.history });
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => historyApi.clearHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.history });
    },
  });

  return {
    history: data?.data?.items || [],
    isLoading,
    error: error as Error | null,
    total: data?.data?.total || 0,
    page: data?.data?.page || 1,
    totalPages: data?.data?.totalPages || 0,
    removeItem: (articleId: string) => removeMutation.mutate(articleId),
    clearAll: () => clearMutation.mutate(),
    isRemoving: removeMutation.isPending || clearMutation.isPending,
  };
}

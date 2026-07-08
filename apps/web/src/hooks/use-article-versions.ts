'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { versionsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useArticleVersions(slug: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.versions(slug),
    queryFn: () => versionsApi.list(slug),
    enabled: !!slug,
  });

  const restoreMutation = useMutation({
    mutationFn: (versionId: string) => versionsApi.restore(slug, versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.versions(slug) });
      queryClient.invalidateQueries({ queryKey: queryKeys.article(slug) });
    },
  });

  return {
    versions: query.data?.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
    restoreVersion: restoreMutation.mutate,
    isRestoring: restoreMutation.isPending,
  };
}

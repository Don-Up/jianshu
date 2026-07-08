'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { collectionsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useCollections() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.collections,
    queryFn: async () => {
      try {
        return await collectionsApi.list();
      } catch {
        // Return empty on error to prevent stuck loading state
        return { success: true, data: [] };
      }
    },
    staleTime: 30000,
    retry: 1,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; isPublic?: boolean }) =>
      collectionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collections });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string; isPublic?: boolean } }) =>
      collectionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collections });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => collectionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collections });
    },
  });

  const addArticleMutation = useMutation({
    mutationFn: ({ collectionId, slug }: { collectionId: string; slug: string }) =>
      collectionsApi.addArticle(collectionId, slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collections });
    },
  });

  const removeArticleMutation = useMutation({
    mutationFn: ({ collectionId, articleId }: { collectionId: string; articleId: string }) =>
      collectionsApi.removeArticle(collectionId, articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collections });
    },
  });

  return {
    collections: query.data?.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
    createCollection: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateCollection: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteCollection: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    addArticle: addArticleMutation.mutate,
    isAddingArticle: addArticleMutation.isPending,
    removeArticle: removeArticleMutation.mutate,
    isRemovingArticle: removeArticleMutation.isPending,
  };
}

export function useBookmarks() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.bookmarks,
    queryFn: () => collectionsApi.getBookmarks(),
  });

  const toggleMutation = useMutation({
    mutationFn: (slug: string) => collectionsApi.toggleBookmark(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks });
    },
  });

  return {
    bookmarks: query.data?.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
    toggleBookmark: toggleMutation.mutate,
    isToggling: toggleMutation.isPending,
  };
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { commentApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { CommentNode } from '@/types';
import type { CreateCommentRequest } from '@jianshu/shared';

export function useComments(slug: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.comments(slug),
    queryFn: () => commentApi.list(slug),
    enabled: !!slug,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCommentRequest) => commentApi.create(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments(slug) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => commentApi.delete(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments(slug) });
    },
  });

  const likeMutation = useMutation({
    mutationFn: ({ commentId, isLiked }: { commentId: string; isLiked: boolean }) => {
      if (isLiked) {
        return commentApi.unlike(commentId);
      }
      return commentApi.like(commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments(slug) });
    },
  });

  return {
    comments: query.data?.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
    createComment: createMutation.mutate,
    isCreating: createMutation.isPending,
    deleteComment: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    likeComment: likeMutation.mutate,
    isLiking: likeMutation.isPending,
  };
}

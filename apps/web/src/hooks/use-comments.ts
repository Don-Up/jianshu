'use client';

import { useState, useCallback } from 'react';
import { commentApi } from '@/lib/api';
import type { Comment, CommentListParams } from '@jianshu/shared';

interface UseCommentsResult {
  comments: Comment[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadComments: (articleId: string, page?: number) => Promise<void>;
  createComment: (articleId: string, content: string) => Promise<boolean>;
  deleteComment: (articleId: string, commentId: string) => Promise<boolean>;
  loadMore: () => Promise<void>;
}

export function useComments(): UseCommentsResult {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [articleId, setArticleId] = useState<string>('');
  const [totalPages, setTotalPages] = useState(1);

  const loadComments = useCallback(async (artId: string, pageNum: number = 1) => {
    setIsLoading(true);
    setError(null);
    setArticleId(artId);

    try {
      const res = await commentApi.list(artId, { page: pageNum, limit: 10 });
      if (res.success && res.data) {
        if (pageNum === 1) {
          setComments(res.data.items);
        } else {
          setComments((prev) => [...prev, ...res.data!.items]);
        }
        setTotalPages(res.data.totalPages);
        setHasMore(pageNum < res.data.totalPages);
        setPage(pageNum);
      } else {
        setError(res.error || 'Failed to load comments');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || page >= totalPages) return;
    await loadComments(articleId, page + 1);
  }, [hasMore, isLoading, page, totalPages, articleId, loadComments]);

  const createComment = useCallback(async (artId: string, content: string): Promise<boolean> => {
    try {
      const res = await commentApi.create(artId, { content });
      if (res.success && res.data) {
        const newComment = res.data as unknown as Comment;
        setComments((prev) => [newComment, ...prev]);
        return true;
      }
      setError(res.error || 'Failed to create comment');
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create comment');
      return false;
    }
  }, []);

  const deleteComment = useCallback(async (artId: string, commentId: string): Promise<boolean> => {
    try {
      const res = await commentApi.delete(artId, commentId);
      if (res.success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        return true;
      }
      setError(res.error || 'Failed to delete comment');
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
      return false;
    }
  }, []);

  return {
    comments,
    isLoading,
    error,
    hasMore,
    loadComments,
    createComment,
    deleteComment,
    loadMore,
  };
}
'use client';

import { useEffect, useState } from 'react';
import { CommentForm } from './comment-form';
import { CommentList } from './comment-list';
import { useComments } from '@/hooks/use-comments';
import { useAuth } from '@/hooks/use-auth';

interface CommentsSectionProps {
  articleId: string;
}

export function CommentsSection({ articleId }: CommentsSectionProps) {
  const { user } = useAuth();
  const { comments, isLoading, hasMore, loadComments, createComment, deleteComment, loadMore } = useComments();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadComments(articleId);
  }, [articleId, loadComments]);

  const handleSubmit = async (content: string) => {
    setIsSubmitting(true);
    const success = await createComment(articleId, content);
    setIsSubmitting(false);
    return success;
  };

  const handleDelete = async (commentId: string) => {
    setDeletingId(commentId);
    const success = await deleteComment(articleId, commentId);
    setDeletingId(null);
    return success;
  };

  return (
    <div className="space-y-4">
      <CommentForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      <CommentList
        comments={comments}
        hasMore={hasMore}
        isLoading={isLoading}
        onDelete={handleDelete}
        onLoadMore={loadMore}
      />
    </div>
  );
}
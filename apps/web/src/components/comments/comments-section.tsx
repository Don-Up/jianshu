'use client';

import { useState } from 'react';
import { CommentForm } from './comment-form';
import { CommentList } from './comment-list';
import { useComments } from '@/hooks/use-comments';
import { useAuth } from '@/hooks/use-auth';

interface CommentsSectionProps {
  slug: string;
}

export function CommentsSection({ slug }: CommentsSectionProps) {
  const { user } = useAuth();
  const {
    comments,
    isLoading,
    createComment,
    deleteComment,
    likeComment,
    isCreating,
    isDeleting,
    isLiking,
  } = useComments(slug);

  const handleSubmit = async (content: string) => {
    createComment({ content }, { onSettled: () => {} });
    return true;
  };

  const handleDelete = (commentId: string) => {
    deleteComment(commentId, { onSettled: () => {} });
  };

  const handleLike = (commentId: string, isLiked: boolean) => {
    likeComment({ commentId, isLiked }, { onSettled: () => {} });
  };

  const handleReply = (parentId: string, content: string) => {
    createComment({ content, parentId }, { onSettled: () => {} });
  };

  return (
    <div className="space-y-4">
      <CommentForm onSubmit={handleSubmit} isSubmitting={isCreating} />
      <CommentList
        comments={comments}
        isLoading={isLoading}
        onDelete={handleDelete}
        onLike={handleLike}
        onReply={handleReply}
        isDeleting={isDeleting}
        isLiking={isLiking}
      />
    </div>
  );
}

'use client';

import { CommentItem } from './comment-item';
import type { CommentNode } from '@/types';

interface CommentListProps {
  comments: CommentNode[];
  isLoading: boolean;
  onDelete: (commentId: string) => void;
  onLike: (commentId: string, isLiked: boolean) => void;
  onReply?: (parentId: string, content: string) => void;
  isDeleting?: boolean;
  isLiking?: boolean;
}

export function CommentList({
  comments,
  isLoading,
  onDelete,
  onLike,
  onReply,
  isDeleting = false,
  isLiking = false,
}: CommentListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No comments yet. Be the first to comment!
      </p>
    );
  }

  return (
    <div className="divide-y divide-border">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onDelete={onDelete}
          onLike={onLike}
          onReply={onReply}
          isDeleting={isDeleting}
          isLiking={isLiking}
        />
      ))}
    </div>
  );
}

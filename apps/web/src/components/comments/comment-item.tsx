'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import type { CommentNode } from '@/types';
import { useAuth } from '@/hooks/use-auth';

interface CommentItemProps {
  comment: CommentNode;
  onDelete: (commentId: string) => void;
  onLike: (commentId: string, isLiked: boolean) => void;
  onReply?: (commentId: string, content: string) => void;
  isDeleting?: boolean;
  isLiking?: boolean;
  depth?: number;
}

export function CommentItem({
  comment,
  onDelete,
  onLike,
  onReply,
  isDeleting = false,
  isLiking = false,
  depth = 0,
}: CommentItemProps) {
  const { user } = useAuth();
  const isOwner = user?.id === comment.authorId;
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      onDelete(comment.id);
    }
  };

  const handleReplySubmit = async () => {
    if (!replyContent.trim() || !onReply) return;
    onReply(comment.id, replyContent.trim());
    setReplyContent('');
    setShowReplyForm(false);
  };

  return (
    <div className="py-3">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={comment.author.avatar || undefined} />
          <AvatarFallback>
            {comment.author.name?.slice(0, 2).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {comment.author.name || comment.author.username}
              </span>
              <span className="text-xs text-muted-foreground">
                @{comment.author.username}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(comment.createdAt)}
              </span>
            </div>

            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-muted-foreground hover:text-destructive text-xs"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            )}
          </div>

          <p className="mt-1 text-sm text-foreground whitespace-pre-wrap break-words">
            {comment.content}
          </p>

          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => onLike(comment.id, comment.isLiked)}
              disabled={isLiking}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary disabled:opacity-50"
            >
              <span>{comment.isLiked ? '❤️' : '🤍'}</span>
              <span>{comment.likeCount}</span>
            </button>

            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              Reply
            </button>
          </div>

          {showReplyForm && (
            <div className="mt-3 space-y-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="w-full p-2 text-sm border rounded-md resize-none"
                rows={2}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReplyForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleReplySubmit}
                  disabled={!replyContent.trim()}
                >
                  Reply
                </Button>
              </div>
            </div>
          )}

          {/* Nested replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 pl-4 border-l-2 border-border space-y-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onDelete={onDelete}
                  onLike={onLike}
                  onReply={onReply}
                  isDeleting={isDeleting}
                  isLiking={isLiking}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

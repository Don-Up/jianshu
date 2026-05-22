'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import type { Comment } from '@jianshu/shared';
import { useAuth } from '@/hooks/use-auth';

interface CommentItemProps {
  comment: Comment;
  onDelete: (commentId: string) => Promise<boolean>;
  isDeleting?: boolean;
}

export function CommentItem({ comment, onDelete, isDeleting = false }: CommentItemProps) {
  const { user } = useAuth();
  const isOwner = user?.id === comment.author.id;

  const handleDelete = async () => {
    if (window.confirm('确定要删除这条评论吗？')) {
      await onDelete(comment.id);
    }
  };

  return (
    <div className="flex gap-3 py-4">
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
              删除
            </Button>
          )}
        </div>
        <p className="mt-1 text-sm text-foreground whitespace-pre-wrap break-words">
          {comment.content}
        </p>
      </div>
    </div>
  );
}
'use client';

import { CommentItem } from './comment-item';
import { Button } from '@/components/ui/button';
import type { Comment } from '@jianshu/shared';

interface CommentListProps {
  comments: Comment[];
  hasMore: boolean;
  isLoading: boolean;
  onDelete: (commentId: string) => Promise<boolean>;
  onLoadMore: () => void;
}

export function CommentList({ comments, hasMore, isLoading, onDelete, onLoadMore }: CommentListProps) {
  if (comments.length === 0 && !isLoading) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        暂无评论，快来发表第一条评论吧
      </p>
    );
  }

  return (
    <div>
      {comments.map((comment) => (
        <div key={comment.id} className="border-b last:border-b-0">
          <CommentItem comment={comment} onDelete={onDelete} />
        </div>
      ))}

      {hasMore && (
        <div className="py-4 text-center">
          <Button variant="outline" onClick={onLoadMore} disabled={isLoading}>
            {isLoading ? '加载中...' : '加载更多'}
          </Button>
        </div>
      )}
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useComments } from '@/hooks/use-comments';
import { useAuth } from '@/hooks/use-auth';
import type { CommentNode } from '@/types';

interface CommentsSectionProps {
  slug: string;
}

export function CommentsSection({ slug }: CommentsSectionProps) {
  const { user } = useAuth();
  const { comments, isLoading, createComment, deleteComment, likeComment, isCreating, isDeleting, isLiking } = useComments(slug);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = async (content: string) => {
    setIsSubmitting(true);
    createComment({ content }, {
      onSettled: () => setIsSubmitting(false),
    });
    return true;
  };

  const handleDelete = async (commentId: string) => {
    setDeletingId(commentId);
    deleteComment(commentId, {
      onSettled: () => setDeletingId(null),
    });
    return true;
  };

  const handleLike = (commentId: string, isLiked: boolean) => {
    likeComment({ commentId, isLiked });
  };

  return (
    <div className="space-y-4">
      <CommentForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting || isCreating}
        user={user}
      />
      <CommentList
        comments={comments}
        isLoading={isLoading}
        onDelete={handleDelete}
        onLike={handleLike}
        deletingId={deletingId}
        isLiking={isLiking}
        currentUserId={user?.id}
      />
    </div>
  );
}

// Placeholder - will be created in Task 2
function CommentForm({ onSubmit, isSubmitting, user }: any) {
  const [content, setContent] = useState('');

  if (!user) {
    return <p className="text-muted-foreground">登录后可以发表评论</p>;
  }

  return (
    <div className="space-y-2">
      <textarea
        className="w-full p-3 border rounded-md"
        placeholder="写下你的评论..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
      />
      <button
        onClick={async () => {
          if (content.trim()) {
            await onSubmit(content);
            setContent('');
          }
        }}
        disabled={isSubmitting || !content.trim()}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
      >
        {isSubmitting ? '发布中...' : '发布'}
      </button>
    </div>
  );
}

// Placeholder - will be created in Task 2
function CommentList({
  comments,
  isLoading,
  onDelete,
  onLike,
  deletingId,
  isLiking,
  currentUserId
}: {
  comments: CommentNode[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onLike: (id: string, isLiked: boolean) => void;
  deletingId: string | null;
  isLiking: boolean;
  currentUserId?: string;
}) {
  if (isLoading) {
    return <div>加载中...</div>;
  }

  if (!comments.length) {
    return <p className="text-muted-foreground">暂无评论，来说两句吧</p>;
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onDelete={onDelete}
          onLike={onLike}
          deletingId={deletingId}
          isLiking={isLiking}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
}

// Placeholder - will be created in Task 2
function CommentItem({
  comment,
  onDelete,
  onLike,
  deletingId,
  isLiking,
  currentUserId,
  depth = 0
}: {
  comment: CommentNode;
  onDelete: (id: string) => void;
  onLike: (id: string, isLiked: boolean) => void;
  deletingId: string | null;
  isLiking: boolean;
  currentUserId?: string;
  depth?: number;
}) {
  const isOwner = currentUserId === comment.authorId;
  const [showReply, setShowReply] = useState(false);

  return (
    <div className="space-y-2" style={{ marginLeft: depth * 24 }}>
      <div className="border rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium">{comment.author.name}</span>
          <span className="text-xs text-muted-foreground">@{comment.author.username}</span>
        </div>
        <p className="text-sm">{comment.content}</p>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <button
            onClick={() => onLike(comment.id, comment.isLiked)}
            disabled={isLiking}
            className="flex items-center gap-1 hover:text-primary"
          >
            {comment.isLiked ? '❤️' : '🤍'} {comment.likeCount}
          </button>
          <button
            onClick={() => setShowReply(!showReply)}
            className="hover:text-primary"
          >
            回复
          </button>
          {isOwner && (
            <button
              onClick={() => onDelete(comment.id)}
              disabled={deletingId === comment.id}
              className="hover:text-destructive"
            >
              {deletingId === comment.id ? '删除中...' : '删除'}
            </button>
          )}
        </div>
      </div>

      {showReply && (
        <div className="ml-4" style={{ marginLeft: 24 }}>
          <textarea
            className="w-full p-2 border rounded text-sm"
            placeholder="写下你的回复..."
            rows={2}
          />
        </div>
      )}

      {comment.replies?.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          onDelete={onDelete}
          onLike={onLike}
          deletingId={deletingId}
          isLiking={isLiking}
          currentUserId={currentUserId}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

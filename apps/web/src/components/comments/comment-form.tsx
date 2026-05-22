'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';

interface CommentFormProps {
  onSubmit: (content: string) => Promise<boolean>;
  isSubmitting?: boolean;
}

export function CommentForm({ onSubmit, isSubmitting = false }: CommentFormProps) {
  const [content, setContent] = useState('');
  const { isAuthenticated } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const success = await onSubmit(content.trim());
    if (success) {
      setContent('');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-sm text-muted-foreground">
        请{' '}
        <a href="/login" className="text-primary underline hover:underline">
          登录
        </a>
        {' '}后发表评论
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="写下你的评论..."
        className="min-h-[80px] resize-y"
        maxLength={2000}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !content.trim()}>
          {isSubmitting ? '发布中...' : '发布评论'}
        </Button>
      </div>
    </form>
  );
}
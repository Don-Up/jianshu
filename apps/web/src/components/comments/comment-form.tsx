'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';

interface CommentFormProps {
  onSubmit: (content: string) => Promise<boolean>;
  isSubmitting?: boolean;
  placeholder?: string;
}

export function CommentForm({
  onSubmit,
  isSubmitting = false,
  placeholder = 'Write a comment...',
}: CommentFormProps) {
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
        Please{' '}
        <a href="/login" className="text-primary underline hover:underline">
          login
        </a>{' '}
        to comment
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="min-h-[80px] resize-y"
        maxLength={2000}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !content.trim()}>
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </Button>
      </div>
    </form>
  );
}

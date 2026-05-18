'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { TiptapEditor } from '@/components/tiptap/tiptap-editor';
import { articleApi } from '@/lib/api';
import type { CreateArticleRequest } from '@jianshu/shared';

interface ArticleEditorProps {
  initialData?: Partial<CreateArticleRequest>;
  slug?: string;
  isEditing?: boolean;
}

export function ArticleEditor({ initialData, slug, isEditing }: ArticleEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [tags, setTags] = useState((initialData?.tags || []).join(', '));
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Sync with initialData when it changes (e.g., after article loads)
  useEffect(() => {
    if (initialData) {
      if (initialData.title !== undefined) setTitle(initialData.title);
      if (initialData.content !== undefined) setContent(initialData.content);
      if (initialData.excerpt !== undefined) setExcerpt(initialData.excerpt);
      if (initialData.coverImage !== undefined) setCoverImage(initialData.coverImage);
      if (initialData.tags !== undefined) setTags(initialData.tags.join(', '));
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent, publish: boolean = true) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const articleData: CreateArticleRequest = {
      title,
      content,
      excerpt: excerpt || undefined,
      coverImage: coverImage || undefined,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
    };

    try {
      let result;
      if (isEditing && slug) {
        result = await articleApi.update(slug, articleData);
      } else {
        result = await articleApi.create(articleData);
      }

      if (result.success && result.data) {
        router.push(`/article/${result.data.slug}`);
      } else {
        setError(result.error || 'Failed to save article');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save article');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    await handleSubmit(e, false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
      <Card>
        <CardContent className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>
          )}

          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入文章标题..."
            className="text-2xl font-bold border-none px-0 focus:ring-0 placeholder:text-muted-foreground"
            required
          />

          <div className="flex gap-4">
            <Input
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="封面图片 URL（可选）"
              className="flex-1"
            />
          </div>

          <TiptapEditor
            content={content}
            onChange={setContent}
            placeholder="输入文章内容..."
          />

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">摘要（可选）</label>
            <Textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="文章摘要..."
              className="min-h-[80px] resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">标签（用逗号分隔）</label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="技术, 随笔, 读书..."
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            取消
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={isSubmitting}>
              保存草稿
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '发布中...' : '发布'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  );
}
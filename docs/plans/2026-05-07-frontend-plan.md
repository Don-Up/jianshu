# Jianshu Frontend v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add production-ready features to the blogging platform: comments, search, notifications, server-side auth, enhanced editor, and improved UX patterns.

**Architecture:** Next.js 14 with App Router, TanStack Query for server state, React Hook Form + Zod for forms, Sonner for toasts, TipTap for rich text editing.

**Tech Stack:** Next.js 14, TanStack Query, React Hook Form, Zod, Sonner, TipTap, React Markdown

---

## File Structure

```
apps/web/
├── src/
│   ├── app/
│   │   ├── (app)/
│   │   │   ├── notifications/page.tsx     # NEW: Notifications page
│   │   │   └── layout.tsx               # Already exists
│   │   ├── article/[slug]/
│   │   │   └── page.tsx                 # MODIFY: Add comments
│   │   └── api/
│   │       └── upload/route.ts          # NEW: Image upload endpoint
│   ├── components/
│   │   ├── article/
│   │   │   ├── article-editor.tsx       # MODIFY: Add TipTap
│   │   │   ├── comment-section.tsx      # NEW: Comments
│   │   │   └── comment-form.tsx         # NEW: Comment form
│   │   ├── search/
│   │   │   ├── search-input.tsx          # NEW: Search in header
│   │   │   └── search-results.tsx        # NEW: Search results
│   │   ├── notifications/
│   │   │   └── notification-list.tsx     # NEW: Notifications
│   │   └── ui/
│   │       └── sonner.tsx               # NEW: Toast provider
│   ├── hooks/
│   │   ├── use-notifications.ts         # NEW: Notifications hook
│   │   └── use-search.ts                # NEW: Search hook
│   ├── lib/
│   │   ├── upload.ts                    # NEW: Image upload utility
│   │   └── query-client.ts             # NEW: TanStack Query setup
│   └── middleware.ts                    # NEW: Auth middleware
├── middleware.ts                        # NEW: Route protection
└── package.json
```

---

## Task 1: TanStack Query & Error Handling

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/src/lib/query-client.ts`
- Create: `apps/web/src/components/ui/sonner.tsx`
- Modify: `apps/web/src/app/layout.tsx`

- [ ] **Step 1: Install dependencies**

```bash
cd apps/web
pnpm add @tanstack/react-query sonner
```

- [ ] **Step 2: Create query client**

Create `apps/web/src/lib/query-client.ts`:

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});
```

- [ ] **Step 3: Create toast provider**

Create `apps/web/src/components/ui/sonner.tsx`:

```typescript
'use client';

import { Toaster } from 'sonner';

export function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'var(--background)',
          border: '1px solid var(--border)',
          color: 'var(--foreground)',
        },
      }}
    />
  );
}
```

- [ ] **Step 4: Update root layout with QueryClientProvider**

Modify `apps/web/src/app/layout.tsx`:

```typescript
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProviderWrapper } from '@/components/auth/auth-provider';
import { ToasterProvider } from '@/components/ui/sonner';
import { queryClient } from '@/lib/query-client';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <QueryClientProvider client={queryClient}>
          <AuthProviderWrapper>
            <ToasterProvider />
            {children}
          </AuthProviderWrapper>
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/query-client.ts apps/web/src/components/ui/sonner.tsx apps/web/src/app/layout.tsx apps/web/package.json
git commit -m "feat(web): add TanStack Query and Sonner toast notifications"
```

---

## Task 2: Server-Side Auth Middleware

**Files:**
- Create: `apps/web/src/middleware.ts`
- Modify: `apps/web/next.config.js`

- [ ] **Step 1: Create middleware for route protection**

Create `apps/web/src/middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/write', '/settings', '/notifications'];
const authRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('jianshu_token')?.value;
  const isAuthenticated = !!token;
  const { pathname } = request.nextUrl;

  // Protected routes require auth
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect authenticated users away from auth pages
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

- [ ] **Step 2: Update next config for cookie handling**

Modify `apps/web/next.config.js`:

```javascript
const nextConfig = {
  transpilePackages: ['@jianshu/shared'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/middleware.ts apps/web/next.config.js
git commit -m "feat(web): add server-side auth middleware for route protection"
```

---

## Task 3: Enhanced Article Editor with TipTap

**Files:**
- Modify: `apps/web/src/components/article/article-editor.tsx`
- Install: TipTap packages

- [ ] **Step 1: Install TipTap dependencies**

```bash
cd apps/web
pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-link
```

- [ ] **Step 2: Update article editor with TipTap**

Modify `apps/web/src/components/article/article-editor.tsx`:

```typescript
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
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
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [tags, setTags] = useState((initialData?.tags || []).join(', '));
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: '输入文章内容...（支持 Markdown）',
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: initialData?.content || '',
    editorProps: {
      attributes: {
        class: 'min-h-[400px] px-4 py-3 focus:outline-none text-lg leading-relaxed',
      },
    },
  });

  const handleSubmit = useCallback(async (publish: boolean = true) => {
    if (!editor?.getText().trim()) {
      toast.error('请输入文章内容');
      return;
    }

    setIsSubmitting(true);

    const articleData = {
      title,
      content: editor?.getHTML() || '',
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
        toast.success(publish ? '发布成功' : '保存草稿成功');
        router.push(`/article/${result.data.slug}`);
      } else {
        toast.error(result.error || '保存失败');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setIsSubmitting(false);
    }
  }, [editor, title, excerpt, coverImage, tags, isEditing, slug, router]);

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardContent className="p-6 space-y-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入文章标题..."
            className="text-2xl font-bold border-none px-0 focus:ring-0 placeholder:text-gray-300"
          />

          <div className="flex gap-4">
            <input
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="封面图片 URL（可选）"
              className="flex-1 h-10 px-3 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="flex gap-2 p-2 border-b bg-gray-50">
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className={`p-2 rounded ${editor?.isActive('bold') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              >
                B
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className={`p-2 rounded ${editor?.isActive('italic') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              >
                I
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`p-2 rounded ${editor?.isActive('heading', { level: 2 }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                className={`p-2 rounded ${editor?.isActive('bulletList') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              >
                •
              </button>
            </div>
            <EditorContent editor={editor} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">摘要（可选）</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="文章摘要..."
              className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">标签（用逗号分隔）</label>
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
            <Button type="button" variant="ghost" onClick={() => handleSubmit(false)} disabled={isSubmitting}>
              保存草稿
            </Button>
            <Button onClick={() => handleSubmit(true)} disabled={isSubmitting}>
              {isSubmitting ? '发布中...' : '发布'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/article/article-editor.tsx apps/web/package.json
git commit -m "feat(web): enhance article editor with TipTap rich text editing"
```

---

## Task 4: Comments System

**Files:**
- Create: `apps/web/src/components/article/comment-section.tsx`
- Create: `apps/web/src/components/article/comment-form.tsx`
- Modify: `apps/web/src/app/article/[slug]/page.tsx`
- Add to: `apps/web/src/lib/api.ts`

- [ ] **Step 1: Add comment API methods**

Modify `apps/web/src/lib/api.ts` - add commentApi:

```typescript
export const commentApi = {
  create: (articleId: string, content: string) =>
    fetchApi<{ id: string; content: string; createdAt: string }>(`/api/articles/${articleId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  list: (articleId: string, page: number = 1, limit: number = 20) =>
    fetchApi<{ items: Comment[]; total: number; page: number; totalPages: number }>(
      `/api/articles/${articleId}/comments?page=${page}&limit=${limit}`
    ),
};
```

- [ ] **Step 2: Create comment form component**

Create `apps/web/src/components/article/comment-form.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { commentApi } from '@/lib/api';

interface CommentFormProps {
  articleId: string;
}

export function CommentForm({ articleId }: CommentFormProps) {
  const [content, setContent] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (content: string) => commentApi.create(articleId, content),
    onSuccess: () => {
      setContent('');
      toast.success('评论成功');
      queryClient.invalidateQueries({ queryKey: ['comments', articleId] });
    },
    onError: () => {
      toast.error('评论失败');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    mutation.mutate(content);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="写下你的评论..."
        className="min-h-[100px]"
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={!content.trim() || mutation.isPending}>
          {mutation.isPending ? '发送中...' : '发送'}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Create comment section component**

Create `apps/web/src/components/article/comment-section.tsx`:

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { Avatar } from '@/components/ui/avatar';
import { commentApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { CommentForm } from './comment-form';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    name: string;
    avatar: string | null;
  };
}

interface CommentSectionProps {
  articleId: string;
}

export function CommentSection({ articleId }: CommentSectionProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['comments', articleId],
    queryFn: () => commentApi.list(articleId),
  });

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">评论 ({data?.data?.total || 0})</h3>

      <div className="mb-6">
        <CommentForm articleId={articleId} />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-4 w-full bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : data?.data?.items?.length > 0 ? (
        <div className="space-y-4">
          {data.data.items.map((comment: Comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar
                src={comment.author.avatar}
                alt={comment.author.name}
                size="sm"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{comment.author.name}</span>
                  <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-700">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-center py-4">还没有评论</p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Update article detail page**

Modify `apps/web/src/app/article/[slug]/page.tsx`:

```typescript
// Add CommentSection import and render it in the comments section
import { CommentSection } from '@/components/article/comment-section';

// In the return statement, replace placeholder with:
<CommentSection articleId={article.id} />
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/api.ts apps/web/src/components/article/comment-section.tsx apps/web/src/components/article/comment-form.tsx apps/web/src/app/article/\[slug\]/page.tsx
git commit -m "feat(web): add comments system with TanStack Query mutations"
```

---

## Task 5: Search Functionality

**Files:**
- Create: `apps/web/src/components/search/search-input.tsx`
- Create: `apps/web/src/components/search/search-results.tsx`
- Create: `apps/web/src/hooks/use-search.ts`
- Modify: `apps/web/src/components/layout/header.tsx`

- [ ] **Step 1: Create search hook**

Create `apps/web/src/hooks/use-search.ts`:

```typescript
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { articleApi } from '@/lib/api';
import type { ArticleWithAuthor } from '@/types';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['articles', 'search', query],
    queryFn: () => articleApi.list({ search: query, limit: 10 }),
    enabled: query.length >= 2,
  });

  const results: ArticleWithAuthor[] = data?.data?.items || [];

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  return {
    query,
    setQuery,
    results,
    isLoading,
    isOpen,
    open,
    close,
  };
}
```

- [ ] **Step 2: Create search input with dropdown**

Create `apps/web/src/components/search/search-input.tsx`:

```typescript
'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSearch } from '@/hooks/use-search';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { formatDate } from '@/lib/utils';

export function SearchInput() {
  const { query, setQuery, results, isLoading, isOpen, open, close } = useSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        close();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [close]);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="search"
        placeholder="搜索文章..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          open();
        }}
        onFocus={open}
        className="w-64"
      />

      {isOpen && query.length >= 2 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg overflow-hidden z-50"
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-400">搜索中...</div>
          ) : results.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              {results.map((article) => (
                <Link
                  key={article.id}
                  href={`/article/${article.slug}`}
                  onClick={close}
                  className="flex gap-3 p-3 hover:bg-gray-50"
                >
                  <Avatar src={article.author.avatar} alt={article.author.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{article.title}</p>
                    <p className="text-xs text-gray-400">
                      {article.author.name} · {formatDate(article.createdAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-400">未找到相关文章</div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Update header to include search**

Modify `apps/web/src/components/layout/header.tsx`:

```typescript
import { SearchInput } from '@/components/search/search-input';

// Add SearchInput to the header, e.g.:
<div className="hidden md:flex items-center gap-4">
  <SearchInput />
  <nav>...</nav>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/hooks/use-search.ts apps/web/src/components/search/search-input.tsx apps/web/src/components/layout/header.tsx
git commit -m "feat(web): add search functionality with dropdown results"
```

---

## Task 6: Notifications Page

**Files:**
- Create: `apps/web/src/app/(app)/notifications/page.tsx`
- Create: `apps/web/src/components/notifications/notification-list.tsx`
- Create: `apps/web/src/hooks/use-notifications.ts`
- Add to: `apps/web/src/lib/api.ts`

- [ ] **Step 1: Add notifications API**

Modify `apps/web/src/lib/api.ts`:

```typescript
export const notificationApi = {
  list: (params?: { page?: number; limit?: number }) =>
    fetchApi<{ items: Notification[]; total: number }>(`/api/notifications`),

  markAsRead: (id: string) =>
    fetchApi(`/api/notifications/${id}/read`, { method: 'POST' }),

  markAllAsRead: () =>
    fetchApi('/api/notifications/read-all', { method: 'POST' }),
};
```

- [ ] **Step 2: Create notifications hook**

Create `apps/web/src/hooks/use-notifications.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/lib/api';

export function useNotifications() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.list(),
  });

  const markAsRead = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    notifications: query.data?.data?.items || [],
    total: query.data?.data?.total || 0,
    isLoading: query.isLoading,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
  };
}
```

- [ ] **Step 3: Create notification list component**

Create `apps/web/src/components/notifications/notification-list.tsx`:

```typescript
'use client';

import Link from 'next/link';
import { useNotifications } from '@/hooks/use-notifications';
import { Avatar } from '@/components/ui/avatar';
import { formatDate } from '@/lib/utils';
import type { Notification } from '@/lib/api';

export function NotificationList() {
  const { notifications, isLoading, markAsRead, markAllAsRead } = useNotifications();

  if (isLoading) {
    return <div className="animate-pulse space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded" />)}</div>;
  }

  if (notifications.length === 0) {
    return <p className="text-center text-gray-400 py-8">暂无通知</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">通知</h2>
        <button onClick={() => markAllAsRead()} className="text-sm text-primary-600 hover:underline">
          全部标为已读
        </button>
      </div>
      <div className="space-y-2">
        {notifications.map((notification: Notification) => (
          <Link
            key={notification.id}
            href={notification.link || '#'}
            onClick={() => !notification.isRead && markAsRead(notification.id)}
            className={`flex gap-3 p-4 rounded-lg ${notification.isRead ? 'bg-white' : 'bg-primary-50'}`}
          >
            <Avatar src={notification.actor?.avatar} alt={notification.actor?.name || ''} size="sm" />
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-medium">{notification.actor?.name}</span>
                {' '}
                {notification.message}
              </p>
              <p className="text-xs text-gray-400 mt-1">{formatDate(notification.createdAt)}</p>
            </div>
            {!notification.isRead && <div className="w-2 h-2 rounded-full bg-primary-500" />}
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create notifications page**

Create `apps/web/src/app/(app)/notifications/page.tsx`:

```typescript
import { PageLayout } from '@/components/layout/page-layout';
import { NotificationList } from '@/components/notifications/notification-list';

export default function NotificationsPage() {
  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <NotificationList />
      </div>
    </PageLayout>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/api.ts apps/web/src/hooks/use-notifications.ts apps/web/src/components/notifications/notification-list.tsx apps/web/src/app/\(app\)/notifications/page.tsx
git commit -m "feat(web): add notifications page with mark as read"
```

---

## Task 7: Final Verification

- [ ] **Step 1: Run full test suite**

```bash
pnpm --filter @jianshu/web test
```

Expected: All tests pass

- [ ] **Step 2: Run typecheck**

```bash
pnpm --filter @jianshu/web typecheck
```

Expected: No errors

- [ ] **Step 3: Run build**

```bash
pnpm --filter @jianshu/web build
```

Expected: Successful build

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(web): complete v2 with comments, search, notifications, enhanced editor"
```

---

## Verification Checklist

- [ ] Home page with article list
- [ ] Search dropdown with results
- [ ] Article detail with TipTap editor
- [ ] Comments on article page
- [ ] Notifications page
- [ ] Write article page
- [ ] Settings page
- [ ] Protected routes redirect to login
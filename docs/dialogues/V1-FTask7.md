### Part1: The Problem with Direct Data Fetching

**: I noticed the home page fetches articles and displays them. But what if I want to read a full article? Where does that data come from?

(: Good question. The home page shows a list of article cards, each with a link to `/article/{slug}`. The slug is a unique identifier for each article, like `my-first-post` instead of `123`.

**: So the URL itself contains the article ID?

(: Exactly. Look at the home page code - each ArticleCard renders a link:

```tsx
<Link href={`/article/${article.slug}`}>
  <h2>{article.title}</h2>
</Link>
```

When you click, Next.js routes to `/article/my-first-post`, and we need to extract `my-first-post` from the URL and fetch that specific article.

**: How do we get the slug from the URL in Next.js?

(: In Next.js App Router, we use the `useParams` hook. It's similar to how you'd get route parameters in Express or other frameworks:

```tsx
'use client';

import { useParams } from 'next/navigation';

export default function ArticlePage() {
  const params = useParams();
  const slug = params.slug as string;
  // Now we have "my-first-post"
}
```

**: Why do we need `as string`?

(: Because `params.slug` could be a string or string array depending on the route. Since our route is `/article/[slug]` (single segment), it's always a string, but TypeScript doesn't know that automatically.

#### Part1 Recap
> 1. Article slugs are URL-friendly identifiers stored in the database.
> 2. Next.js dynamic routes like `[slug]` capture URL segments as parameters.
> 3. `useParams()` hook extracts route parameters in client components.

---

### Part2: Custom Hooks for Data Fetching

**: I see we created `use-article.ts` as a separate hook. Why not just fetch the data directly in the page component?

(: That's a great observation. There are several reasons:

1. **Reusability** - If another page needs to load an article (like an edit page), we can reuse the hook.

2. **Separation of concerns** - The hook handles data fetching logic, while the page handles presentation.

3. **State management** - Hooks can hold state that survives component re-renders.

Let me show you the hook structure:

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { articleApi } from '@/lib/api';

export function useArticle(slug: string) {
  const [article, setArticle] = useState<ArticleWithAuthor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticle = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await articleApi.getBySlug(slug);
      if (res.success && res.data) {
        setArticle(res.data);
      } else {
        setError('Article not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  // ...
}
```

**: I notice `useCallback` is used. Why is that necessary?

(: `useCallback` memoizes the function so it doesn't get recreated on every render. This is important because `useEffect` depends on `fetchArticle` - if we didn't memoize it, we'd either get infinite re-fetching or need to add `fetchArticle` to the dependency array, which would also cause issues.

**: What about the dependency array `[fetchArticle]`? Since `fetchArticle` is memoized with `useCallback`, it only changes when `slug` changes, which is exactly what we want.

(: Precisely. And notice that `fetchArticle` depends on `slug`. So when `slug` changes (user navigates to a different article), `fetchArticle` gets recreated, which triggers the `useEffect` to run.

#### Part2 Recap
> 1. Custom hooks separate data fetching from UI components.
> 2. `useCallback` memoizes functions and enables safe use in `useEffect` dependencies.
> 3. The dependency array `[fetchArticle]` ensures re-fetching when slug changes.

---

### Part3: Loading and Error States

**: What happens if the API is slow or the article doesn't exist?

(: Great point. We handle three states:

1. **Loading state** - While fetching
2. **Error state** - If something goes wrong
3. **Success state** - If we get the article

Here's how the page component uses these:

```tsx
if (isLoading) {
  return (
    <PageLayout>
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-muted rounded w-3/4" />
        <div className="h-6 bg-muted rounded w-1/4" />
        <div className="h-64 bg-muted rounded" />
      </div>
    </PageLayout>
  );
}

if (error || !article) {
  return (
    <PageLayout>
      <div className="text-center">
        <h1>文章不存在</h1>
        <p>{error}</p>
      </div>
    </PageLayout>
  );
}
```

**: The skeleton loading UI looks nice. Why use `animate-pulse` instead of a spinner?

(: Both are valid, but skeletons are generally better for content because:
- They show the layout structure before content loads
- Users can anticipate where content will appear
- It feels faster than a spinner because partial content appears progressively

The spinner is better for actions (like submitting a form) where there's no skeleton to show.

#### Part3 Recap
> 1. Three states: loading, error, and success must all be handled.
> 2. Skeleton UI with `animate-pulse` provides better UX than spinners for content.
> 3. Error messages should be user-friendly, not technical.

---

### Part4: Interactive Features - Like Button

**: How does the like button work? I see it's passed as a callback to ArticleContent.

(: The like feature is interesting because it involves both reading and updating state. Let me trace through it:

1. The page has `likeArticle` from the hook and `isLiking` local state:

```tsx
const { article, isLoading, error, likeArticle } = useArticle(slug);
const [isLiking, setIsLiking] = useState(false);

const handleLike = async () => {
  setIsLiking(true);
  try {
    await likeArticle();
  } finally {
    setIsLiking(false);
  }
};
```

2. We pass `handleLike` and `isLiking` to ArticleContent:

```tsx
<ArticleContent
  article={article}
  onLike={handleLike}
  isLiking={isLiking}
/>
```

3. The ArticleContent Button uses these:

```tsx
<Button
  variant={article.isLiked ? 'default' : 'secondary'}
  size="sm"
  onClick={onLike}
  disabled={isLiking}
>
  <svg ... fill={article.isLiked ? 'currentColor' : 'none'} />
  {article.likeCount}
</Button>
```

**: Why do we need a local `isLiking` state if the hook already has `isLiked`?

(: `isLiked` tells us whether the current user has liked the article globally. `isLiking` is a local UI state that prevents double-clicks while the API request is in flight. This is important because API requests are asynchronous - without this guard, a user could click rapidly and send multiple like requests.

**: What does the API return when we like an article?

(: The API returns the new like count:

```tsx
const res = await articleApi.like(slug);
// res.data.likeCount would be the updated count
```

The hook then updates local state optimistically:

```tsx
setArticle((prev) =>
  prev ? { ...prev, likeCount: res.data!.likeCount, isLiked: !prev.isLiked } : null
);
```

#### Part4 Recap
> 1. Like button requires both global state (`isLiked`) and local UI state (`isLiking`).
> 2. `isLiking` prevents double-submit during async API calls.
> 3. Optimistic UI updates provide immediate feedback before server confirmation.

---

### Part5: Component Composition

**: The ArticleContent component is used in the detail page. Is it the same one used on the home page?

(: Exactly - it's a reusable component. Look at the structure:

- **ArticleCard** - Compact view for lists (title, excerpt, author, stats)
- **ArticleContent** - Full view for detail pages (title, author, like button, full content, tags)
- **ArticleList** - Wrapper that handles loading skeleton and empty state

This is component composition. The same ArticleContent can appear in:
- The article detail page
- A "featured article" section
- An "Editor's picks" widget

**: So the ArticleContent receives the entire article object?

(: Yes, and it destructures only what it needs:

```tsx
interface ArticleContentProps {
  article: ArticleWithAuthor;
  onLike?: () => void;
  isLiking?: boolean;
}

export function ArticleContent({ article, onLike, isLiking }: ArticleContentProps) {
  // Uses: article.title, article.author, article.content, article.tags, etc.
}
```

This makes the component flexible - it doesn't need to know how the article was fetched or what page it's on.

#### Part5 Recap
> 1. Component composition allows reusable pieces like ArticleContent.
> 2. Components should be designed to be agnostic of their context.
> 3. Props interfaces clearly define what data a component needs.

---

### Summary

1. **Dynamic routing** in Next.js uses `[slug]` folders to capture URL parameters via `useParams()`.

2. **Custom hooks** like `useArticle` encapsulate data fetching logic, making components cleaner and code more reusable.

3. **Three states** (loading, error, success) must all be handled to provide good UX.

4. **Memoization with `useCallback`** prevents infinite loops and ensures effects run only when needed.

5. **Optimistic UI updates** like the like button provide immediate feedback while async operations complete.

6. **Component composition** through reusable components like ArticleContent reduces duplication and improves maintainability.

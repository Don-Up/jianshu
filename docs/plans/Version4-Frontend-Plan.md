# Version4 Frontend Implementation Plan

## Overview

V3 Frontend completed TanStack Query integration, error boundaries, and skeleton loading. Version4 Frontend focuses on:
- **B1: Comment System** - nested comments with likes
- **C1: Editor Enhancement** - code blocks with syntax highlighting, blockquotes, horizontal rules

---

## Part 1: B1 Comment System

### Task 1: Query Keys & Hook

### Files

- `apps/web/src/lib/query-keys.ts`
- `apps/web/src/hooks/use-comments.ts` (new)

### Steps

1. Add `comments` and `comment` keys to `queryKeys`
2. Create `useComments(slug)` hook using `useQuery`
3. Create `useCreateComment` mutation
4. Create `useDeleteComment` mutation
5. Create `useLikeComment` mutation with optimistic update
6. Return nested comment tree structure

---

### Task 2: Comment Components

### Files

- `apps/web/src/components/comments/comment-list.tsx` (new)
- `apps/web/src/components/comments/comment-item.tsx` (new)
- `apps/web/src/components/comments/comment-form.tsx` (new)
- `apps/web/src/components/comments/comment-reply-form.tsx` (new)

### Steps

1. Create `CommentForm` - textarea with submit button
2. Create `CommentReplyForm` - inline reply form
3. Create `CommentItem` - displays single comment with:
   - Author avatar and username
   - Content
   - Like button with count
   - Reply button
   - Delete button (if author)
   - Recursive `CommentItem` for replies
4. Create `CommentList` - renders top-level comments with nested replies

---

### Task 3: Article Page Integration

### Files

- `apps/web/src/app/article/[slug]/page.tsx`

### Steps

1. Import `CommentList` and `CommentForm` components
2. Add comments section below article content
3. Connect `useComments` hook for data
4. Show loading skeleton while fetching
5. Show empty state if no comments

---

## Part 2: C1 Editor Enhancement

### Task 4: TipTap Extensions

### Files

- `apps/web/src/components/article/article-editor.tsx`
- `apps/web/src/components/article/tiptap-extensions.ts` (new or modify)

### Steps

1. Add `@tiptap/extension-code-block` with syntax highlighting (use lowlight/highlight.js)
2. Add `@tiptap/extension-blockquote`
3. Add `@tiptap/extension-horizontal-rule`
4. Configure toolbar buttons:
   - "引用" button → Blockquote
   - "分割线" button → HorizontalRule
   - Code block button already exists, update styling
5. Add CSS for syntax highlighting theme

---

## File Structure

```
apps/web/src/
├── app/
│   └── article/[slug]/
│       └── page.tsx                   # Modify: add comments section
├── components/
│   ├── comments/
│   │   ├── comment-list.tsx           # New
│   │   ├── comment-item.tsx           # New
│   │   ├── comment-form.tsx           # New
│   │   └── comment-reply-form.tsx     # New
│   └── article/
│       ├── article-editor.tsx          # Modify: add toolbar buttons
│       └── tiptap-extensions.ts       # New or modify
├── hooks/
│   └── use-comments.ts                # New
└── lib/
    └── query-keys.ts                  # Modify: add comment keys
```

---

## Verification

1. Build: `pnpm --filter @jianshu/web build` completes without errors
2. Tests: `pnpm --filter @jianshu/web test` all pass
3. Article page: add top-level comment
4. Article page: reply to comment (verify nested display)
5. Article page: like/unlike comment (verify count update)
6. Article page: delete own comment
7. Editor: insert code block with syntax highlighting
8. Editor: insert blockquote
9. Editor: insert horizontal rule

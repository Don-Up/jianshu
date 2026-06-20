# Version4 Backend Implementation Plan

## Overview

V3 Backend completed Redis caching, WebSocket notifications, and image upload. Version4 Backend focuses on **B1: Comment System** - adding nested comments with likes, following the same patterns established in V3.

---

## Task 1: Prisma Schema - Comment & CommentLike Models

### Files

- `apps/api/prisma/schema.prisma`

### Steps

1. Add `Comment` model with self-referencing `parentId` for infinite nesting
2. Add `CommentLike` model with unique constraint on `[commentId, userId]`
3. Add relations to `Article` and `User` models
4. Run `prisma migrate dev` to create migration
5. Run `prisma generate` to update client

---

## Task 2: Comments Module

### Files

- `apps/api/src/comments/comments.module.ts` (new)
- `apps/api/src/comments/comments.controller.ts` (new)
- `apps/api/src/comments/comments.service.ts` (new)
- `apps/api/src/comments/dto/create-comment.dto.ts` (new)
- `apps/api/src/comments/dto/comment-query.dto.ts` (new)

### Steps

1. Create `CommentsModule` with controller and service
2. Create `CommentsController` with endpoints:
   - `GET /api/articles/:slug/comments` - get nested comments
   - `POST /api/articles/:slug/comments` - create comment
   - `DELETE /api/comments/:id` - delete comment
   - `POST /api/comments/:id/like` - like comment
   - `DELETE /api/comments/:id/like` - unlike comment
3. Create `CommentsService` with:
   - `getCommentsByArticle(slug)` - returns nested structure
   - `createComment(slug, dto, userId)` - creates with optional parentId
   - `deleteComment(id, userId)` - deletes only if author
   - `likeComment(id, userId)` - toggle like
   - `buildCommentTree(comments)` - recursive tree builder
4. Add DTOs with class-validator decorators
5. Apply `AuthGuard` to protected endpoints

---

## Task 3: App Module Integration

### Files

- `apps/api/src/app.module.ts`

### Steps

1. Import `CommentsModule`
2. Verify module is properly loaded

---

## File Structure

```
apps/api/src/
├── app.module.ts                       # Modify: import CommentsModule
├── prisma/
│   └── schema.prisma                   # Modify: add Comment, CommentLike
└── comments/
    ├── comments.module.ts              # New
    ├── comments.controller.ts          # New
    ├── comments.service.ts             # New
    └── dto/
        ├── create-comment.dto.ts       # New
        └── comment-query.dto.ts        # New
```

---

## Verification

1. Build: `pnpm --filter @jianshu/api build` completes without errors
2. Tests: `pnpm --filter @jianshu/api test` all pass
3. Create comment → comment saved in database
4. Reply to comment → nested reply appears
5. Like comment → likeCount increases, duplicate like rejected
6. Unlike comment → likeCount decreases
7. Delete comment → only author can delete their own comment
8. Get comments → returns proper nested tree structure

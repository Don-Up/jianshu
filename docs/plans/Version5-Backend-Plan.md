# Version5 Backend Implementation Plan

## Overview

V4 Backend completed Comment System with nested replies and likes. Version5 Backend focuses on **B2: User Interaction Features** (Favorites/Collections + Share) and **C2: Draft & Version Management** (article version history).

---

## Task 1: Favorites/Collections Module

### Files

- `apps/api/prisma/schema.prisma` (modify)
- `apps/api/src/favorites/favorites.module.ts` (new)
- `apps/api/src/favorites/favorites.controller.ts` (new)
- `apps/api/src/favorites/favorites.service.ts` (new)
- `apps/api/src/favorites/dto/` (new)

### Steps

1. Create `Collection` model in Prisma schema (user can create multiple collections)
2. Add `articleId` field to `Bookmark` or create separate `CollectionItem` model
3. Create FavoritesModule with CRUD operations
4. Implement endpoints:
   - `GET /api/users/:username/collections` - list user's collections
   - `POST /api/collections` - create collection
   - `PUT /api/collections/:id` - update collection
   - `DELETE /api/collections/:id` - delete collection
   - `POST /api/articles/:slug/bookmark` - add to default collection
   - `DELETE /api/articles/:slug/bookmark` - remove from collection
   - `POST /api/collections/:id/items` - add article to collection
   - `DELETE /api/collections/:id/items/:articleId` - remove from collection

---

## Task 2: Article Version History Module

### Files

- `apps/api/prisma/schema.prisma` (modify)
- `apps/api/src/versions/versions.module.ts` (new)
- `apps/api/src/versions/versions.controller.ts` (new)
- `apps/api/src/versions/versions.service.ts` (new)
- `apps/api/src/articles/articles.service.ts` (modify - save version on publish)

### Steps

1. Create `ArticleVersion` model in Prisma schema
2. Create VersionsModule
3. Modify ArticlesService to save version before each update
4. Implement endpoints:
   - `GET /api/articles/:slug/versions` - list version history
   - `GET /api/articles/:slug/versions/:versionId` - get specific version
   - `POST /api/articles/:slug/versions/:versionId/restore` - restore to version

---

## File Structure

```
apps/api/
├── prisma/
│   └── schema.prisma               # Modify: add Collection, ArticleVersion
├── src/
│   ├── app.module.ts               # Modify: import FavoritesModule, VersionsModule
│   ├── favorites/
│   │   ├── favorites.module.ts    # New
│   │   ├── favorites.controller.ts # New
│   │   ├── favorites.service.ts    # New
│   │   └── dto/                   # New
│   └── versions/
│       ├── versions.module.ts      # New
│       ├── versions.controller.ts  # New
│       └── versions.service.ts     # New
```

---

## Verification

1. Build: `pnpm --filter @jianshu/api build` completes without errors
2. Tests: `pnpm --filter @jianshu/api test` all pass
3. Create collection → collection created
4. Bookmark article → appears in user's bookmarks
5. Update article → version saved automatically
6. Get version history → returns chronological list
7. Restore version → article content reverted

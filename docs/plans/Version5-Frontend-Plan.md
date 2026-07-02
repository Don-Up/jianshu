# Version5 Frontend Implementation Plan

## Overview

V4 Frontend completed Comment System with nested replies and likes. Version5 Frontend focuses on **B2: User Interaction Features** (Favorites/Collections UI) and **C2: Draft & Version Management** (version history UI).

---

## Task 1: Collections/Favorites UI

### Files

- `apps/web/src/components/collections/` (new)
  - `collection-card.tsx`
  - `collection-list.tsx`
  - `add-to-collection-modal.tsx`
- `apps/web/src/app/user/[username]/`collections/page.tsx` (new)
- `apps/web/src/hooks/use-collections.ts` (new)
- `apps/web/src/lib/query-keys.ts` (modify)

### Steps

1. Create useCollections hook with TanStack Query
2. Create CollectionCard component
3. Create CollectionList component
4. Create AddToCollectionModal for adding articles to collections
5. Create user collections page at `/user/:username/collections`
6. Add "Add to Collection" button on article page

---

## Task 2: Article Version History UI

### Files

- `apps/web/src/components/article/` (modify)
  - `version-history.tsx` (new)
  - `version-item.tsx` (new)
- `apps/web/src/app/article/[slug]/`versions/page.tsx` (new)
- `apps/web/src/hooks/use-article-versions.ts` (new)

### Steps

1. Create useArticleVersions hook
2. Create VersionItem component for displaying single version
3. Create VersionHistory component with timeline view
4. Create article versions page at `/article/:slug/versions`
5. Add "Version History" button on article page (for article author)
6. Add "Restore" action to revert to previous version

---

## Task 3: User Profile Collections Tab

### Files

- `apps/web/src/app/user/[username]/page.tsx` (modify)

### Steps

1. Add tab navigation on user profile: "Articles" | "Collections"
2. Display user's collections when Collections tab is active
3. Show collection preview with article count and cover images

---

## File Structure

```
apps/web/src/
├── app/
│   ├── user/[username]/
│   │   ├── page.tsx                 # Modify: add collections tab
│   │   └── collections/
│   │       └── page.tsx            # New: user collections page
│   └── article/[slug]/
│       └── versions/
│           └── page.tsx             # New: version history page
├── components/
│   ├── collections/
│   │   ├── collection-card.tsx     # New
│   │   ├── collection-list.tsx      # New
│   │   └── add-to-collection-modal.tsx  # New
│   └── article/
│       ├── version-history.tsx       # New
│       └── version-item.tsx         # New
├── hooks/
│   ├── use-collections.ts          # New
│   └── use-article-versions.ts     # New
└── lib/
    └── query-keys.ts               # Modify: add collection keys
```

---

## Verification

1. Build: `pnpm --filter @jianshu/web build` completes without errors
2. Tests: `pnpm --filter @jianshu/web test` all pass
3. User profile: collections tab displays user's collections
4. Article page: "Add to Collection" button opens modal
5. Article author: "Version History" button shows history
6. Version history: clicking "Restore" reverts article content

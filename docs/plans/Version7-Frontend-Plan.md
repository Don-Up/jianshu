# Version7 Frontend Implementation Plan

## Overview

V6 Frontend completed Share UI, Follow System UI, Notifications UI, Search Improvements, and User Profile Enhancements. Version7 Frontend focuses on **Reading History** (viewed articles list), **Home Feed** (following feed), **Draft Management** (draft editor), and **User Settings** (account page, notification preferences).

---

## Task 1: Reading History UI

### Files

- `apps/web/src/app/history/page.tsx` (new)
- `apps/web/src/components/history/` (new)
  - `history-list.tsx` (new)
  - `history-item.tsx` (new)
- `apps/web/src/hooks/use-history.ts` (new)
- `apps/web/src/lib/query-keys.ts` (modify)

### Steps

1. Create useHistory hook with TanStack Query
2. Create HistoryItem component for displaying single history entry
3. Create HistoryList component with article preview
4. Create history page at `/history`
5. Add navigation link in user dropdown menu

---

## Task 2: Home Feed UI

### Files

- `apps/web/src/app/page.tsx` (modify - currently landing, needs redesign)
- `apps/web/src/components/feed/` (new)
  - `feed-list.tsx` (new)
  - `feed-item.tsx` (new)
- `apps/web/src/hooks/use-feed.ts` (new)
- `apps/web/src/lib/query-keys.ts` (modify)

### Steps

1. Create useFeed hook with TanStack Query
2. Create FeedItem component for article cards in feed
3. Create FeedList component with infinite scroll
4. Transform home page (`/`) to show personalized feed when logged in
5. Show trending/recommended articles for anonymous users

---

## Task 3: Draft Management UI

### Files

- `apps/web/src/app/editor/drafts/page.tsx` (new)
- `apps/web/src/components/editor/` (modify)
  - `draft-list.tsx` (new)
  - `draft-item.tsx` (new)
- `apps/web/src/hooks/use-drafts.ts` (new)
- `apps/web/src/lib/query-keys.ts` (modify)

### Steps

1. Create useDrafts hook with TanStack Query
2. Create DraftItem component with preview
3. Create DraftList component
4. Create drafts management page at `/editor/drafts`
5. Add "Drafts" link in editor navigation

### Draft Editor Integration

- Auto-save indicator in editor
- Draft status badge
- "Publish" vs "Save Draft" buttons
- Draft list in editor sidebar

---

## Task 4: User Settings UI

### Files

- `apps/web/src/app/settings/page.tsx` (new)
- `apps/web/src/app/settings/` (new)
  - `account/page.tsx` (new)
  - `notifications/page.tsx` (new)
  - `profile/page.tsx` (new)
- `apps/web/src/components/settings/` (new)
  - `settings-form.tsx` (new)
  - `notification-preferences.tsx` (new)
  - `account-danger-zone.tsx` (new)
- `apps/web/src/hooks/use-settings.ts` (new)
- `apps/web/src/lib/query-keys.ts` (modify)

### Steps

1. Create useSettings hook
2. Create SettingsLayout with navigation tabs
3. Create AccountSettings page (username, email, bio)
4. Create NotificationSettings page (toggle preferences)
5. Create ProfileSettings page (avatar, name, bio)
6. Create AccountDangerZone (delete account)
7. Add Settings link in user dropdown menu

---

## Task 5: Navigation & UX Improvements

### Files

- `apps/web/src/components/layout/` (modify)
  - `header.tsx` (modify - add history link)
  - `user-dropdown.tsx` (modify - add settings, drafts links)
- `apps/web/src/app/layout.tsx` (modify)

### Steps

1. Add "Reading History" link in header/user menu
2. Add "My Drafts" link in header/user menu
3. Add "Settings" link in header/user menu
4. Improve mobile navigation
5. Add notification badge to header

---

## File Structure

```
apps/web/src/
├── app/
│   ├── page.tsx                     # Modify: home feed for logged in users
│   ├── history/
│   │   └── page.tsx                # New: reading history
│   ├── editor/
│   │   └── drafts/
│   │       └── page.tsx            # New: drafts management
│   └── settings/
│       ├── page.tsx                # New: settings layout
│       ├── account/
│       │   └── page.tsx            # New
│       ├── notifications/
│       │   └── page.tsx            # New
│       └── profile/
│           └── page.tsx            # New
├── components/
│   ├── history/
│   │   ├── history-list.tsx         # New
│   │   └── history-item.tsx         # New
│   ├── feed/
│   │   ├── feed-list.tsx            # New
│   │   └── feed-item.tsx            # New
│   ├── editor/
│   │   ├── draft-list.tsx           # New
│   │   └── draft-item.tsx           # New
│   ├── settings/
│   │   ├── settings-form.tsx        # New
│   │   ├── notification-preferences.tsx  # New
│   │   └── account-danger-zone.tsx  # New
│   └── layout/
│       ├── header.tsx               # Modify
│       └── user-dropdown.tsx        # Modify
├── hooks/
│   ├── use-history.ts              # New
│   ├── use-feed.ts                 # New
│   ├── use-drafts.ts               # New
│   └── use-settings.ts             # New
└── lib/
    └── query-keys.ts               # Modify: add history, feed, drafts, settings keys
```

---

## Verification

1. Build: `pnpm --filter @jianshu/web build` completes without errors
2. Tests: `pnpm --filter @jianshu/web test` all pass
3. History: navigate to `/history` shows viewed articles
4. Feed: home page shows personalized feed when logged in
5. Drafts: `/editor/drafts` lists user's drafts
6. Settings: `/settings` allows updating account and notification preferences
7. Navigation: all new links accessible from header/dropdown

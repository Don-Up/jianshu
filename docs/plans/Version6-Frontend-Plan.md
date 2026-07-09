# Version6 Frontend Implementation Plan

## Overview

V5 Frontend completed Collections/Favorites UI, Article Version History UI, and User Profile Collections Tab. Version6 Frontend focuses on **D1: Share & Social Features** (share buttons, follow system UI) and **E1: Search & Discovery** (search improvements, user profile enhancements).

---

## Task 1: Share UI

### Files

- `apps/web/src/components/article/` (modify)
  - `share-button.tsx` (new)
- `apps/web/src/app/article/[slug]/page.tsx` (modify)

### Steps

1. Create ShareButton component with share options (copy link, WeChat, etc.)
2. Add share button to article page
3. Show share count if available

---

## Task 2: Follow System UI

### Files

- `apps/web/src/hooks/use-follow.ts` (new) - Extract follow logic from ProfileHeader
- `apps/web/src/components/user/user-stats.tsx` (new) - Extract stats display component
- `apps/web/src/components/user/profile-header.tsx` (modify) - Use new hook and UserStats
- `apps/web/src/app/user/[username]/page.tsx` (modify) - Add followers/following tabs

### Status

- ✅ Follow button with optimistic update - Already implemented in `ProfileHeader`
- ✅ Stats display in profile header - Already implemented inline
- ❌ `use-follow.ts` hook - Not extracted, logic is inline
- ❌ `user-stats.tsx` component - Not extracted, markup is inline
- ❌ Followers/Following tabs - Not implemented

### Steps

1. Create `useFollow` hook extracting follow/unfollow logic from ProfileHeader
2. Create `UserStats` component for follower/following/article counts display
3. Refactor `ProfileHeader` to use new hook and UserStats component
4. Add Followers tab to user profile page
5. Add Following tab to user profile page
6. Create FollowersList and FollowingList components

---

## Task 3: Notifications Improvements

### Files

- `apps/web/src/app/notifications/page.tsx` (modify)
- `apps/web/src/components/notifications/` (modify)
  - `notification-list.tsx` (modify)
  - `notification-item.tsx` (modify)

### Steps

1. Add notification grouping by date
2. Add mark all as read button
3. Add unread count badge to header
4. Improve notification item UI

---

## Task 4: Search Improvements

### Files

- `apps/web/src/app/search/page.tsx` (modify)
- `apps/web/src/components/search/` (new)
  - `search-filters.tsx` (new)
  - `search-results.tsx` (modify)

### Steps

1. Add filter options (date range, sort by)
2. Add user search results
3. Add collection search results
4. Add recent searches history

---

## Task 5: User Profile Enhancements

### Files

- `apps/web/src/app/user/[username]/page.tsx` (modify)
- `apps/web/src/components/user/` (modify)
  - `profile-tabs.tsx` (new)

### Steps

1. Add tab navigation: Articles | Collections | Followers
2. Create FollowersList component
3. Create FollowingList component
4. Add empty states for each tab

---

## File Structure

```
apps/web/src/
├── app/
│   ├── article/[slug]/
│   │   └── page.tsx              # Modify: add share button
│   ├── notifications/
│   │   └── page.tsx             # Modify: improvements
│   ├── search/
│   │   └── page.tsx             # Modify: add filters
│   └── user/[username]/
│       └── page.tsx              # Modify: add follow tabs
├── components/
│   ├── article/
│   │   └── share-button.tsx     # New
│   ├── user/
│   │   ├── user-stats.tsx        # New (extract from ProfileHeader)
│   │   ├── profile-tabs.tsx      # New
│   │   └── profile-header.tsx    # Modify: use useFollow hook
│   └── notifications/
│       ├── notification-list.tsx  # Modify
│       └── notification-item.tsx  # Modify
├── hooks/
│   └── use-follow.ts             # New (extract from ProfileHeader)
└── lib/
    └── query-keys.ts              # Modify: add follow keys
```

---

## Verification

1. Build: `pnpm --filter @jianshu/web build` completes without errors
2. Tests: `pnpm --filter @jianshu/web test` all pass
3. Share: clicking share button shows options and copies link
4. Follow: clicking follow button updates follower count
5. Notifications: grouped by date with mark all read
6. Search: filters work correctly with results
7. Profile: tabs switch between articles/collections/followers

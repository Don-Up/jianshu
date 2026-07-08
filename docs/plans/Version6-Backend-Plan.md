# Version6 Backend Implementation Plan

## Overview

V5 Backend completed Collections/Favorites Module and Article Version History Module. Version6 Backend focuses on **D1: Share & Social Features** (share functionality, user followers/following, notifications improvements) and **E1: Search & Discovery** (search functionality, user profiles, article analytics).

---

## Task 1: Share Module

### Files

- `apps/api/prisma/schema.prisma` (modify)
- `apps/api/src/share/share.module.ts` (new)
- `apps/api/src/share/share.controller.ts` (new)
- `apps/api/src/share/share.service.ts` (new)

### Steps

1. Create `Share` model in Prisma schema (track share counts by platform)
2. Create ShareModule
3. Implement endpoints:
   - `POST /api/articles/:slug/share` - record a share
   - `GET /api/articles/:slug/shares` - get share counts

---

## Task 2: Follow System Module

### Files

- `apps/api/prisma/schema.prisma` (modify - ensure Follow model exists)
- `apps/api/src/follow/follow.module.ts` (new)
- `apps/api/src/follow/follow.controller.ts` (new)
- `apps/api/src/follow/follow.service.ts` (new)

### Steps

1. Review existing Follow model in schema
2. Create FollowModule
3. Implement endpoints:
   - `GET /api/users/:username/followers` - list user's followers
   - `GET /api/users/:username/following` - list users followed by user
   - `POST /api/users/:username/follow` - follow/unfollow a user
   - `GET /api/users/:username/stats` - get follower/following counts

---

## Task 3: User Notifications Module

### Files

- `apps/api/src/notifications/notifications.service.ts` (modify)
- `apps/api/src/notifications/notifications.controller.ts` (modify)

### Steps

1. Add notification preferences settings
2. Add batch mark-as-read endpoint
3. Add notification count endpoint
4. Implement notification grouping

---

## Task 4: Article Analytics Module

### Files

- `apps/api/src/analytics/analytics.module.ts` (new)
- `apps/api/src/analytics/analytics.controller.ts` (new)
- `apps/api/src/analytics/analytics.service.ts` (new)

### Steps

1. Create AnalyticsModule
2. Implement endpoints:
   - `GET /api/articles/:slug/analytics` - get article view/read stats
   - `GET /api/users/:username/analytics` - get author's overall stats

---

## File Structure

```
apps/api/
├── prisma/
│   └── schema.prisma               # Modify: add Share model
├── src/
│   ├── app.module.ts               # Modify: import new modules
│   ├── share/                       # New
│   │   ├── share.module.ts
│   │   ├── share.controller.ts
│   │   └── share.service.ts
│   ├── follow/                      # New
│   │   ├── follow.module.ts
│   │   ├── follow.controller.ts
│   │   └── follow.service.ts
│   ├── analytics/                   # New
│   │   ├── analytics.module.ts
│   │   ├── analytics.controller.ts
│   │   └── analytics.service.ts
│   └── notifications/
│       ├── notifications.service.ts  # Modify
│       └── notifications.controller.ts # Modify
```

---

## Verification

1. Build: `pnpm --filter @jianshu/api build` completes without errors
2. Tests: `pnpm --filter @jianshu/api test` all pass
3. Share article → share count incremented
4. Follow user → appears in following list
5. Get notifications → grouped and marked read correctly
6. View analytics → shows article stats

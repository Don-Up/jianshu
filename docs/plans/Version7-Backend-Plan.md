# Version7 Backend Implementation Plan

## Overview

V6 Backend completed Share Module, Follow System, Notifications improvements, and Article Analytics. Version7 Backend focuses on **Reading History** (track viewed articles), **Home Feed** (personalized feed from followed users), **Draft Management** (article drafts), and **User Settings** (account management, notification preferences).

---

## Task 1: Reading History Module

### Files

- `apps/api/prisma/schema.prisma` (modify)
- `apps/api/src/history/history.module.ts` (new)
- `apps/api/src/history/history.controller.ts` (new)
- `apps/api/src/history/history.service.ts` (new)

### Steps

1. Create `ReadingHistory` model in Prisma schema (track article views with timestamp)
2. Create HistoryModule
3. Implement endpoints:
   - `POST /api/articles/:slug/view` - record article view
   - `GET /api/users/me/history` - get user's reading history
   - `DELETE /api/users/me/history/:articleId` - remove from history
   - `DELETE /api/users/me/history` - clear all history

### Prisma Model

```prisma
model ReadingHistory {
  id        String   @id @default(cuid())
  userId    String
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  articleId String
  article   Article @relation(fields: [articleId], references: [id], onDelete: Cascade)
  viewedAt  DateTime @default(now())

  @@unique([userId, articleId])
  @@index([userId, viewedAt])
  @@map("reading_history")
}
```

---

## Task 2: Home Feed Module

### Files

- `apps/api/src/feed/feed.module.ts` (new)
- `apps/api/src/feed/feed.controller.ts` (new)
- `apps/api/src/feed/feed.service.ts` (new)

### Steps

1. Create FeedModule
2. Implement endpoints:
   - `GET /api/feed` - get personalized feed (articles from followed users)
   - `GET /api/feed/recommended` - get recommended articles for user

### Feed Algorithm

1. Get articles from users the current user follows
2. Exclude articles the user has already read
3. Sort by: publishedAt DESC
4. Support pagination with cursor-based or offset pagination

---

## Task 3: Draft Management Module

### Files

- `apps/api/prisma/schema.prisma` (modify - add isDraft field)
- `apps/api/src/drafts/drafts.module.ts` (new)
- `apps/api/src/drafts/drafts.controller.ts` (new)
- `apps/api/src/drafts/drafts.service.ts` (new)

### Steps

1. Add `isDraft` field to Article model (default: true for new articles)
2. Create DraftsModule
3. Implement endpoints:
   - `GET /api/articles/drafts` - list user's draft articles
   - `GET /api/articles/drafts/:slug` - get specific draft
   - `POST /api/articles/drafts` - create draft
   - `PATCH /api/articles/drafts/:slug` - update draft
   - `DELETE /api/articles/drafts/:slug` - delete draft
   - `POST /api/articles/drafts/:slug/publish` - publish draft

### Draft Behavior

- New articles created as drafts by default
- Drafts only visible to author
- Publishing sets `isDraft: false` and `publishedAt: now()`
- Draft auto-save endpoint for editor

---

## Task 4: User Settings Module

### Files

- `apps/api/prisma/schema.prisma` (modify - add notification preferences to User)
- `apps/api/src/settings/settings.module.ts` (new)
- `apps/api/src/settings/settings.controller.ts` (new)
- `apps/api/src/settings/settings.service.ts` (new)
- `apps/api/src/settings/dto/` (new)

### Steps

1. Add notification preferences to User model (emailNotifications, pushNotifications, etc.)
2. Create SettingsModule
3. Implement endpoints:
   - `GET /api/users/me/settings` - get user settings
   - `PATCH /api/users/me/settings` - update user settings
   - `PATCH /api/users/me/settings/notifications` - update notification preferences
   - `DELETE /api/users/me/account` - delete account

### User Settings Schema

```prisma
model User {
  // ... existing fields
  emailNotifications Boolean @default(true)
  pushNotifications  Boolean @default(true)
  followNotifications Boolean @default(true)
  commentNotifications Boolean @default(true)
}
```

---

## File Structure

```
apps/api/
├── prisma/
│   └── schema.prisma               # Modify: add ReadingHistory, isDraft, notification prefs
├── src/
│   ├── app.module.ts               # Modify: import new modules
│   ├── history/                     # New
│   │   ├── history.module.ts
│   │   ├── history.controller.ts
│   │   └── history.service.ts
│   ├── feed/                        # New
│   │   ├── feed.module.ts
│   │   ├── feed.controller.ts
│   │   └── feed.service.ts
│   ├── drafts/                      # New
│   │   ├── drafts.module.ts
│   │   ├── drafts.controller.ts
│   │   └── drafts.service.ts
│   └── settings/                    # New
│       ├── settings.module.ts
│       ├── settings.controller.ts
│       ├── settings.service.ts
│       └── dto/
│           ├── update-settings.dto.ts
│           └── notification-preferences.dto.ts
```

---

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/articles/:slug/view | Yes | Record article view |
| GET | /api/users/me/history | Yes | Get reading history |
| DELETE | /api/users/me/history/:articleId | Yes | Remove from history |
| DELETE | /api/users/me/history | Yes | Clear all history |
| GET | /api/feed | Yes | Get home feed |
| GET | /api/feed/recommended | Yes | Get recommended articles |
| GET | /api/articles/drafts | Yes | List drafts |
| GET | /api/articles/drafts/:slug | Yes | Get draft |
| POST | /api/articles/drafts | Yes | Create draft |
| PATCH | /api/articles/drafts/:slug | Yes | Update draft |
| DELETE | /api/articles/drafts/:slug | Yes | Delete draft |
| POST | /api/articles/drafts/:slug/publish | Yes | Publish draft |
| GET | /api/users/me/settings | Yes | Get user settings |
| PATCH | /api/users/me/settings | Yes | Update user settings |
| PATCH | /api/users/me/settings/notifications | Yes | Update notification prefs |
| DELETE | /api/users/me/account | Yes | Delete account |

---

## Verification

1. Build: `pnpm --filter @jianshu/api build` completes without errors
2. Tests: `pnpm --filter @jianshu/api test` all pass
3. View article → appears in reading history
4. Get home feed → shows articles from followed users
5. Create draft → saved as draft
6. Publish draft → article becomes visible
7. Update settings → preferences saved correctly

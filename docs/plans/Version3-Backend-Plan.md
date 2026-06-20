# V3 Backend Implementation Plan

## Overview

V2 Backend is approximately 90% complete with core features (Auth, Articles, Comments, Notifications) fully implemented. V3 focuses on completing missing pieces, adding infrastructure (Redis, image upload), real-time capabilities (WebSocket), and production hardening.

---

## Task 1: Fix Logging Middleware

### Files

- `apps/api/src/main.ts`

### Steps

1. Fix ESM compatibility issue preventing loggerMiddleware from loading
2. Re-enable `app.use(loggerMiddleware)`
3. Verify logs appear in console

---

## Task 2: Complete Notification Triggers

### Files

- `apps/api/src/notifications/notifications.service.ts`
- `apps/api/src/articles/articles.service.ts`
- `apps/api/src/users/users.service.ts`

### Steps

1. Add LIKE notification trigger in ArticlesService.like() method
2. Add FOLLOW notification trigger in UsersService.follow() method
3. Create helper method createNotification(type, userId, actorId, articleId)
4. Verify notifications appear when liking articles and following users

---

## Task 3: Redis Caching Module

### Files

- `apps/api/src/redis/redis.module.ts` (new)
- `apps/api/src/redis/redis.service.ts` (new)

### Steps

1. Install Redis package: `npm install ioredis`
2. Create RedisModule with RedisService
3. Add cache methods: get, set, del, expire
4. Cache article lists with 5 min TTL in ArticlesService
5. Cache user profiles with 10 min TTL in UsersService
6. Cache notification counts with 1 min TTL
7. Invalidate cache on mutations (create, update, delete)

---

## Task 4: Image Upload Endpoint

### Files

- `apps/api/src/upload/upload.module.ts` (new)
- `apps/api/src/upload/upload.controller.ts` (new)
- `apps/api/src/upload/upload.service.ts` (new)

### Steps

1. Install multer and cloudinary packages
2. Create UploadModule with Multer configured
3. Add POST `/api/upload` endpoint
4. Support image/jpeg, image/png, image/webp formats
5. Limit file size to 5MB
6. Return image URL from Cloudinary (or local for dev)

---

## Task 5: WebSocket Gateway for Real-time Notifications

### Files

- `apps/api/src/gateway/notifications.gateway.ts` (new)
- `apps/api/src/gateway/gateway.module.ts` (new)

### Steps

1. Install @nestjs/platform-socket.io
2. Create NotificationsGateway
3. Add @SubscribeMessage('join') for user to join their room
4. Push notification to user's room when created
5. Client subscribes via WebSocket on connect

---

## Task 6: API Versioning Strategy (Optional)

### Files

- `apps/api/src/main.ts`

### Steps

1. Consider adding /api/v2/ prefix for future versions
2. Maintain backward compatibility
3. Document deprecation timeline

---

## File Structure

```
apps/api/src/
├── main.ts                           # Modify: fix logging
├── notifications/
│   └── notifications.service.ts      # Modify: add LIKE/FOLLOW triggers
├── articles/
│   └── articles.service.ts           # Modify: invalidate cache
├── users/
│   └── users.service.ts              # Modify: invalidate cache
├── redis/
│   ├── redis.module.ts               # New
│   └── redis.service.ts               # New
├── upload/
│   ├── upload.module.ts              # New
│   ├── upload.controller.ts          # New
│   └── upload.service.ts              # New
└── gateway/
    ├── gateway.module.ts             # New
    └── notifications.gateway.ts       # New
```

---

## Verification

1. Build: `pnpm --filter @jianshu/api build` completes without errors
2. Tests: `pnpm --filter @jianshu/api test` all pass
3. Like article → notification created in database
4. Follow user → notification created in database
5. Upload image → returns accessible URL
6. WebSocket: connect and receive notification on like/follow
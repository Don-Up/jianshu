# V3 Frontend Implementation Plan

## Overview

V2 Frontend is approximately 80% complete. Core pages and components exist, but several features need completion: Settings page is non-functional, search dropdown missing, notification badge missing, image upload not implemented, TanStack Query not fully integrated.

---

## Task 1: Complete Settings Page Functionality

### Files

- `apps/web/src/app/(app)/settings/page.tsx`
- `apps/web/src/hooks/use-settings.ts` (new)

### Steps

1. Create useSettings hook with profile update and password change
2. Add form with React Hook Form + Zod validation
3. Fields: name, bio, avatar URL
4. Password change form: old password, new password, confirm
5. Connect to userApi.updateProfile and userApi.changePassword
6. Show success/error toasts

---

## Task 2: Add Search Dropdown to Header

### Files

- `apps/web/src/components/layout/header.tsx`
- `apps/web/src/components/search/search-input.tsx` (already exists but not integrated)

### Steps

1. Integrate SearchInput component into Header
2. Replace or augment current SearchBar
3. Test real-time dropdown appears on typing

---

## Task 3: Unread Notification Badge in Header

### Files

- `apps/web/src/components/layout/header.tsx`
- `apps/web/src/hooks/use-notifications.ts`

### Steps

1. Add notification count badge to Header notification icon
2. Use unreadCount from useNotifications hook
3. Show red dot or number when unread > 0
4. Link to /notifications page

---

## Task 4: Functional User Profile Follow Button

### Files

- `apps/web/src/components/user/profile-header.tsx`
- `apps/web/src/app/user/[username]/page.tsx`

### Steps

1. Connect follow button to userApi.follow
2. Toggle following state optimistically
3. Show appropriate button text (关注/已关注)
4. Invalidate user profile cache on follow change

---

## Task 5: Image Upload in Article Editor

### Files

- `apps/web/src/components/article/article-editor.tsx`
- `apps/web/src/lib/upload.ts` (new)
- `apps/web/src/app/api/upload/route.ts` (new)

### Steps

1. Create upload API route in Next.js
2. Proxy to backend upload endpoint
3. Add image upload button to TipTap toolbar
4. Support drag-and-drop images
5. Show upload progress

---

## Task 6: Draft Auto-save for Editor

### Files

- `apps/web/src/components/article/article-editor.tsx`
- `apps/web/src/hooks/use-draft.ts` (new)

### Steps

1. Create useDraft hook using localStorage
2. Auto-save every 30 seconds
3. Save on component unmount
4. Restore draft on page load if slug not provided
5. Clear draft on successful publish

---

## Task 7: TanStack Query Full Integration

### Files

- All hooks in `apps/web/src/hooks/`

### Steps

1. Refactor useAuth to use useQuery/useMutation properly
2. Refactor useArticle to use useQuery/useMutation
3. Add queryClient.invalidateQueries on mutations
4. Implement query key factories for consistency

---

## Task 8: Error Boundaries and Loading States

### Files

- `apps/web/src/components/error-boundary.tsx` (new)
- `apps/web/src/app/(app)/error.tsx` (new)

### Steps

1. Create ErrorBoundary component
2. Add error.tsx to route groups
3. Add loading skeletons for all pages
4. Test error scenarios

---

## File Structure

```
apps/web/src/
├── app/
│   ├── (app)/
│   │   ├── settings/
│   │   │   └── page.tsx              # Modify: functional form
│   │   └── error.tsx                 # New: error boundary
│   └── api/
│       └── upload/
│           └── route.ts               # New: upload proxy
├── components/
│   ├── layout/
│   │   └── header.tsx               # Modify: search dropdown, notification badge
│   ├── article/
│   │   └── article-editor.tsx        # Modify: image upload, auto-save
│   ├── search/
│   │   └── search-input.tsx         # Already exists
│   ├── user/
│   │   └── profile-header.tsx       # Modify: functional follow button
│   ├── error-boundary.tsx           # New
│   └── loading/
│       └── skeleton.tsx              # New: loading skeletons
├── hooks/
│   ├── use-settings.ts              # New
│   ├── use-draft.ts                # New
│   ├── use-article.ts              # Modify: TanStack Query
│   └── use-auth.ts                 # Modify: TanStack Query
└── lib/
    └── upload.ts                    # New
```

---

## Verification

1. Build: `pnpm --filter @jianshu/web build` completes without errors
2. Tests: `pnpm --filter @jianshu/web test` all pass
3. Settings page: update profile successfully
4. Header: search dropdown works on typing
5. Header: notification badge shows unread count
6. User profile: follow button toggles correctly
7. Editor: draft auto-saves to localStorage
8. Error boundary: shows gracefully on errors
# V1-FTask2-API Client & Shared Types Dialogue

**Teacher:** Lily
**Student:** Alex

---

**Lily:** Today we'll set up the API client and shared types for our frontend. Before we start, can you think about why a frontend needs to talk to a backend API?

**Alex:** Hmm, to get data and send data? Like when a user wants to read articles or publish a new one?

**Lily:** Exactly. Now, what challenge do we face when the frontend is in a different codebase than the backend?

**Alex:** The frontend doesn't have direct access to the backend's types... We can't just import `User` or `Article` from the API folder.

**Lily:** Perfect! That's where the shared package comes in. We have `packages/shared/src/index.ts`. What lives there?

**Alex:** Shared TypeScript interfaces that both apps can import. I see `User`, `ApiResponse`, `PaginationParams`...

**Lily:** Right. Now we added more types there. Why do we need `LoginRequest` and `RegisterRequest` when we already have `User`?

**Alex:** Because `User` describes a user entity, but `LoginRequest` describes what we need to send when logging in — email and password. They're different shapes for different purposes.

**Lily:** Excellent distinction! What's the difference between `ApiResponse<T>` and `PaginatedResponse<T>`?

**Alex:** `ApiResponse<T>` is for single-item responses with `success`, `data`, `error`. `PaginatedResponse<T>` is for lists — it has `items`, `total`, `page`, `limit`, `totalPages`.

**Lily:** Good. Now let's look at `packages/shared/src/index.ts`. What did we add to the `User` interface?

**Alex:** We added `username`, `avatar`, `bio`, `followerCount`, `followingCount`, `articleCount`...

**Lily:** Why do we need `username` as a separate field from `id`?

**Alex:** Because `id` is for internal reference (like database primary key), but `username` is what users actually see and use in URLs like `/user/johndoe`.

**Lily:** Spot on! Now let's look at the API client in `apps/web/src/lib/api.ts`. What's the `fetchApi` function doing?

**Alex:** It's a wrapper around `fetch` that adds the auth token from localStorage and sets the Content-Type header.

**Lily:** Why do we need this wrapper instead of using `fetch` directly everywhere?

**Alex:** Because every API call needs the same boilerplate — adding the token, setting headers, handling errors. Wrapper centralizes that logic.

**Lily:** Right. And notice this line:
```typescript
const token = typeof window !== 'undefined' ? localStorage.getItem('jianshu_token') : null;
```
Why do we check `typeof window !== 'undefined'`?

**Alex:** Because during server-side rendering in Next.js, `window` doesn't exist. This check prevents errors during SSR.

**Lily:** Good thinking. Now look at the `authApi` object. What does `login` return?

**Alex:** It returns `ApiResponse<{ token: string; user: User }>` — so on success, we get both the JWT token and the user object.

**Lily:** Why return the user object alongside the token?

**Alex:** So the frontend can immediately have the user's info without making another API call. The login response gives us everything we need.

**Lily:** Now let's look at `articleApi.list`. What does this line do?
```typescript
const searchParams = params
  ? new URLSearchParams(...).toString()
  : '';
```

**Alex:** It converts the params object into a query string like `?page=1&limit=20`. If no params, it returns an empty string.

**Lily:** And why do we filter with `.filter(([, v]) => v !== undefined)`?

**Alex:** To exclude undefined values from the query string. If `tag` is undefined, we don't want `&tag=undefined` in the URL.

**Lily:** Good. Now look at `apps/web/src/lib/auth.ts`. What does `setUser` do?

**Alex:** It stores the user object in localStorage as JSON. `getUser` retrieves and parses it back.

**Lily:** Why store the user in localStorage when we already store the token?

**Alex:** So on page reload, we can show the user's info immediately without waiting for `/api/auth/me` to respond.

**Lily:** Right. What about `isAuthenticated()`?

**Alex:** It just checks if a token exists. Returns `true` if token is present, `false` otherwise.

**Lily:** Now let's look at `apps/web/src/types/index.ts`. What does `ArticleWithAuthor` extend?

**Alex:** It extends `Article` and ensures `author` is a `User` object. The base `Article` type has `author: User`, but this makes it explicit.

**Alex:** So `ArticleWithAuthor` is a type alias for a more specific use case in the frontend?

**Lily:** Exactly. The backend might return an article with just `authorId`, but for the frontend we want the full author object embedded.

## Part 1 Recap
> 1. Shared types in `packages/shared` allow frontend and backend to use the same TypeScript interfaces
> 2. `ApiResponse<T>` wraps single-item responses with success/error tracking
> 3. `PaginatedResponse<T>` handles list responses with pagination metadata
> 4. `LoginRequest`/`RegisterRequest` are request shapes, distinct from entity types like `User`
> 5. `username` is for URLs and display, `id` is for internal references
> 6. The `fetchApi` wrapper centralizes auth token injection and header configuration
> 7. Server-side rendering check (`typeof window !== 'undefined'`) prevents SSR errors

---

## Part 2: Auth Utilities Deep Dive

**Lily:** Let's trace through the login flow. What happens when a user logs in?

**Alex:** 1. Call `authApi.login({ email, password })`
2. `fetchApi` sends POST request with JSON body
3. Backend validates and returns `{ success: true, data: { token, user } }`
4. Frontend stores token via `setToken()` and user via `setUser()`
5. User state is updated

**Lily:** What happens on page reload before we call `authApi.me`?

**Alex:** `isAuthenticated()` returns `true` because token exists in localStorage. `getUser()` returns the cached user object, so we can render the UI immediately.

**Lily:** But why do we still call `authApi.me()` even though we have the cached user?

**Alex:** To verify the token is still valid. The cached user might be stale. Calling `/api/auth/me` ensures the token hasn't expired or been revoked.

**Lily:** What if `authApi.me()` fails?

**Alex:** We call `clearAuth()` to remove the token and user from storage, then set user to `null`. The next render will show the logged-out state.

**Lily:** Good. Now look at the logout function. What does it do?

**Alex:** It calls `clearAuth()` and sets user state to `null`. It doesn't call any API — just clears local storage.

**Lily:** Why doesn't logout call an API endpoint?

**Alex:** Because JWT is stateless. The server doesn't track who's logged in — the token is self-validating. Logout is purely client-side.

**Lily:** Very good. Now let's look at error handling in `fetchApi`. What happens if the response is not ok?

**Alex:** We parse the error response and throw an `Error` with the message. The calling code catches this and handles it.

**Lily:** Why throw an error instead of returning `{ success: false, error: ... }`?

**Alex:** Because for error cases like 401 or 500, the caller typically needs to handle them differently — like redirecting to login or showing a toast. Throwing makes that flow easier.

**Lily:** But doesn't that mean we lose the typed response?

**Alex:** Yes, for error cases we lose type safety. But in `login()`, we catch the error and show it as a user-facing message.

**Lily:** Right. Now let's look at `articleApi`. What does `like` return?

**Alex:** It returns `ApiResponse<{ likeCount: number }>` — just the new like count.

**Lily:** Why only return the like count?

**Alex:** Because the frontend already has the article data. We only need the updated count to increment/decrement the display.

**Lily:** And `bookmark`?

**Alex:** Returns `ApiResponse<{ isBookmarked: boolean }>` — whether the action was to bookmark or unbookmark.

**Lily:** This is a toggle pattern. The button says "Bookmark" if `isBookmarked` is false, "Unbookmark" if true. The API flips the state.

**Alex:** Right. Each click toggles the opposite state.

## Part 2 Recap
> 1. Login flow: API call → store token/user → update state → verify on reload
> 2. `authApi.me()` validates token and syncs user data on page load
> 3. Failed validation clears auth (token expiry, revocation)
> 4. Logout is client-side only since JWT is stateless
> 5. `fetchApi` throws on HTTP errors for distinct error handling paths
> 6. Toggle endpoints (like, bookmark) return just the new state, not full objects
> 7. Error responses lose type safety but allow distinct handling per error type

---

## Part 3: TypeScript Integration

**Lily:** Now let's talk about how the frontend uses these types. What does `ArticleListResponse` expand to?

**Alex:** It's `PaginatedResponse<ArticleWithAuthor>`, which means:
```typescript
{
  items: ArticleWithAuthor[];  // articles with full author User objects
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

**Lily:** And `ArticleResponse`?

**Alex:** It's `ApiResponse<ArticleWithAuthor>`, which is:
```typescript
{
  success: boolean;
  data?: ArticleWithAuthor;  // single article with author
  error?: string;
  message?: string;
}
```

**Lily:** Why create these specific response types instead of using the generic ones?

**Alex:** For better type safety. `ArticleListResponse.items` is guaranteed to be `ArticleWithAuthor[]`, not just `any[]`.

**Lily:** Let's look at `ArticleListParams`. What does it extend?

**Alex:** It extends `PaginationParams` (which has `page` and `limit`) and adds `authorId`, `tag`, `search`.

**Lily:** Why not just put all fields directly in `ArticleListParams`?

**Alex:** Because `PaginationParams` is reusable. Other list endpoints might also use pagination. This composition keeps things DRY.

**Lily:** Now let's see how the `tsconfig.json` setup affects this. What does this path alias do?
```json
"@jianshu/shared": ["../../packages/shared/src/index.ts"]
```

**Alex:** It maps `@jianshu/shared` to the actual file path, so `import from '@jianshu/shared'` works in the frontend code.

**Lily:** And why did we set `"composite": false` in the web tsconfig?

**Alex:** Because composite requires all referenced projects to include each other, but our setup has some limitations. Setting it to false avoids build errors with project references.

**Lily:** Good. Now what about the test setup? Why did we add Vitest?

**Alex:** To test the auth utilities and `cn()` function. The auth tests verify localStorage operations work correctly.

**Lily:** What does the `auth.test.ts` test do?

**Alex:** It tests `getToken`, `setToken`, `getUser`, `setUser`, `clearAuth`, `isAuthenticated` — all the auth utilities. It clears localStorage before/after each test.

**Lily:** Why clear localStorage in `beforeEach`?

**Alex:** To ensure tests are isolated. Each test starts with a clean state, not depending on what previous tests left behind.

## Part 3 Recap
> 1. `ArticleListResponse = PaginatedResponse<ArticleWithAuthor>` gives typed items array
> 2. `ArticleResponse = ApiResponse<ArticleWithAuthor>` types single article responses
> 3. `ArticleListParams extends PaginationParams` reuses pagination structure
> 4. Path alias `@jianshu/shared` maps to shared package source
> 5. `composite: false` avoids TypeScript project reference conflicts
> 6. Vitest setup enables unit testing for utilities
> 7. Tests use `beforeEach` to isolate state via localStorage cleanup

---

## Summary

**Lily:** Let's wrap up. What are the key architectural decisions in Task 2?

**Alex:**
1. Shared types package (`@jianshu/shared`) provides TypeScript interfaces for both frontend and backend
2. `fetchApi` wrapper handles auth token injection and consistent error handling
3. Auth utilities (`auth.ts`) manage token/user in localStorage with SSR safety
4. Typed API clients (`api.ts`) provide end-to-end type safety from request to response
5. Response type aliases (`ArticleListResponse`, `ArticleResponse`) add specificity
6. Pagination uses composition (`extends PaginationParams`) for reusability
7. Unit tests with Vitest verify utility functions in isolation

**Lily:** Great work! You now understand how the frontend communicates with the backend through typed APIs and shared types.

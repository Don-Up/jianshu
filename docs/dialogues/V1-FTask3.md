# V1-FTask3-Auth Hook & Context Dialogue

**Teacher:** Lily
**Student:** Alex

---

**Lily:** Today we'll create the authentication context for our frontend. Why do we need a React context for auth?

**Alex:** Hmm, so multiple components can access the current user without prop drilling?

**Lily:** Exactly! Without context, we'd have to pass `user`, `login`, `logout` through every component. What other approach could we use?

**Alex:** We could use a global store like Zustand or Redux?

**Lily:** We could, but context is simpler for this use case. It's built into React. Now look at the `AuthContext`. What type does it define?

**Alex:** It has `user: User | null`, `isLoading`, `isAuthenticated`, and the methods `login`, `register`, `logout`.

**Lily:** Why do we need both `isAuthenticated` and `user`?

**Alex:** `user` is the actual user object, `isAuthenticated` is a boolean shortcut. `isAuthenticated` just checks `!!user`.

**Lily:** Good. Now let's trace `AuthProvider`. What happens when it first renders?

**Alex:** Initial state is `user: null` and `isLoading: true`.

**Lily:** Right. Then `useEffect` runs with `initAuth`. What does that do?

**Alex:** It checks `isAuthenticated()` — which just checks if a token exists in localStorage.

**Lily:** If there's a token, what happens next?

**Alex:** It tries to get the cached user from localStorage first, then calls `authApi.me()` to validate the token.

**Lily:** Why validate with `me()` if we already have the cached user?

**Alex:** In case the token expired or was revoked since the last visit. The cached user might be stale.

**Lily:** Good thinking. What if `me()` fails?

**Alex:** `clearAuth()` is called to remove the token and user from localStorage, then `setUserState(null)`.

**Lily:** Now look at the `login` function. What's this pattern?
```typescript
const login = useCallback(async (email: string, password: string) => {
  const res = await authApi.login({ email, password });
  if (res.success && res.data) {
    setToken(res.data.token);
    setUserState(res.data.user);
    saveUser(res.data.user);
  } else {
    throw new Error(res.error || 'Login failed');
  }
}, []);
```

**Alex:** It calls the API, and on success stores the token and user in both state and localStorage.

**Lily:** Why store in both places?

**Alex:** State is for current runtime. localStorage is for persistence across page reloads.

**Lily:** And the `useCallback`?

**Alex:** To memoize the function so it doesn't get recreated on every render. The empty dependency array means it never changes.

**Lily:** What about error handling? Why do we throw instead of returning `{ success: false }`?

**Alex:** Throwing forces the caller to handle it with try/catch. This makes error handling explicit at the component level.

**Lily:** Good. Now what does `logout` do?

**Alex:** It calls `clearAuth()` and sets `setUserState(null)`. No API call since JWT is stateless.

**Lily:** Why doesn't logout need a server call?

**Alex:** JWT is stateless — the server doesn't track sessions. The token is self-validating. Logout just means the client forgets the token.

## Part 1 Recap
> 1. React Context provides state sharing without prop drilling
> 2. `AuthContextType` defines the shape: user, isLoading, isAuthenticated, and auth methods
> 3. Initial state: `user: null`, `isLoading: true`
> 4. `initAuth()` validates token on mount via `authApi.me()`
> 5. Cached user is used for fast display, then validated with server call
> 6. Failed validation clears localStorage and resets state
> 7. `useCallback` memoizes login/register/logout to prevent recreation

---

## Part 2: useAuth Hook

**Lily:** Now let's look at the `useAuth` function. What does it do?

**Alex:** It uses `useContext(AuthContext)` to get the context value.

**Lily:** What happens if it's called outside `AuthProvider`?

**Alex:** It throws an error: "useAuth must be used within AuthProvider".

**Lily:** Why throw instead of returning null or default values?

**Alex:** Because using the hook without the provider is a programmer error. Throwing makes it fail fast rather than silently breaking.

**Lily:** Good. How does the component that uses `useAuth` get access to the auth state?

**Alex:** It's wrapped in `AuthProvider` somewhere higher in the tree. In our case, `AuthProviderWrapper` wraps the whole app in `layout.tsx`.

**Lily:** Let's look at `AuthProviderWrapper`. What's its purpose?

**Alex:** It's a thin wrapper that just renders `AuthProvider`. It isolates the provider setup.

**Lily:** Why do we need this separation instead of just exporting `AuthProvider` directly?

**Alex:** For organization. It keeps the raw provider in `hooks/` and creates a component in `components/auth/` for cleaner imports.

**Lily:** Got it. Now think about the flow: user opens app → what renders first?

**Alex:** `layout.tsx` renders `AuthProviderWrapper` which renders `AuthProvider`.

**Lily:** What does `AuthProvider` do on mount?

**Alex:** `useEffect` runs `initAuth()` which checks for token and validates it.

**Lily:** During this validation, what's shown to the user?

**Alex:** `isLoading` is `true`, so components can show a loading spinner or skeleton.

**Lily:** Once auth is validated, what happens?

**Alex:** `isLoading` becomes `false`, `user` has the user object, and `isAuthenticated` is `true`.

**Lily:** Now any component calling `useAuth()` gets the current user state. Can you trace when that state updates?

**Alex:** When `login` or `register` succeeds → `setUserState(user)` → all components using `useAuth()` re-render with new user.

**Lily:** Perfect. Now let's check error handling in `login`. What if the API returns `success: false`?

**Alex:** We throw `Error(res.error || 'Login failed')`. The component calling `login` catches it and shows an error message.

**Lily:** And what if network error is thrown?

**Alex:** The `catch` block in login would catch it. But actually, `fetchApi` already catches network errors and throws `Error`. So it bubbles up the same way.

## Part 2 Recap
> 1. `useAuth()` extracts context value via `useContext(AuthContext)`
> 2. Throwing when context is null enforces proper provider placement
> 3. `AuthProviderWrapper` isolates provider setup from raw provider export
> 4. `AuthProvider` runs `initAuth()` on mount via `useEffect`
> 5. Loading state (`isLoading: true`) displays during auth validation
> 6. Successful auth updates `user` state, triggering re-renders in all consumers
> 7. Both API errors and network errors bubble up as thrown Errors

---

## Part 3: Integration with Layout

**Lily:** Let's look at how we integrated `AuthProvider` into `layout.tsx`. Why do we use `AuthProviderWrapper` instead of `AuthProvider` directly?

**Alex:** To follow our folder structure convention — components that wrap providers live in `components/auth/`.

**Lily:** What would happen if we rendered `AuthProvider` directly in the layout?

**Alex:** It would work the same. The wrapper is just for organization.

**Lily:** Now notice the layout is a server component but `AuthProvider` needs client context. How does this work?

**Alex:** `AuthProviderWrapper` is marked `'use client'` so it runs on the client. The server renders the wrapper, which then renders `AuthProvider` on the client.

**Lily:** Why does `AuthProviderWrapper` need `'use client'`?

**Alex:** Because it uses `AuthProvider` which uses React context. Context only works on the client side.

**Lily:** What about `useAuth()` in child components?

**Alex:** They're also marked `'use client'` since they use context.

**Lily:** Let's trace the component tree: page.tsx → uses `useAuth()` → what's the path?

**Alex:** `layout.tsx` renders `AuthProviderWrapper` → which wraps children with `AuthProvider` → page.tsx calls `useAuth()` → gets context from `AuthProvider`.

**Lily:** What if we have a page that doesn't use `useAuth()`?

**Alex:** It still gets the provider wrapped around it, but it doesn't call `useAuth()`. No issue.

**Lily:** Good. Now let's look at the test setup. Why did we need a wrapper component in tests?

**Alex:** Because `useAuth()` throws if not in `AuthProvider`. Tests need to wrap with `AuthProvider` too.

**Lily:** Right. The test pattern:
```typescript
const wrapperComponent = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);
const { result } = renderHook(() => useAuth(), { wrapper: wrapperComponent });
```

**Alex:** It wraps the hook call with the provider so context is available.

**Lily:** What mocks did we use?

**Alex:** We mocked `authApi` functions and `auth` utilities from `lib/auth.ts`. This lets us control the behavior without real API calls.

## Part 3 Recap
> 1. `AuthProviderWrapper` marks with `'use client'` for client-side context usage
> 2. Server component (`layout.tsx`) renders client component wrapper
> 3. All child pages inherit `AuthProvider` context without explicit wrapping
> 4. Unused providers don't affect components that don't call `useAuth()`
> 5. Tests need `AuthProvider` wrapper to provide context for `useAuth()`
> 6. Mocking `authApi` and `auth` utilities isolates tests from real API/localStorage

---

## Summary

**Lily:** Let's wrap up. What are the key architectural decisions in Task 3?

**Alex:**
1. `AuthProvider` creates React context with user state and auth methods
2. `useAuth()` hook extracts context for consuming components
3. `useCallback` memoizes auth methods to prevent recreation
4. Token validation on mount via `authApi.me()` ensures session validity
5. `AuthProviderWrapper` follows component organization conventions
6. Client directive (`'use client'`) required for context usage
7. Tests mock API and localStorage to isolate auth logic

**Lily:** Great! You now understand how the authentication context works and how it's integrated into the Next.js app.

# Mental Model: Task 2 - Server-Side Auth Middleware

## Key Takeaway

**HTTP-only Cookies + Middleware = Secure Server-Side Auth** — Moving from localStorage tokens to HTTP-only cookies prevents XSS attacks. Middleware provides server-level route protection and automatic token refresh.

## Architecture

```mermaid
flowchart TD
    A["Browser Request"] --> B["Middleware"]
    B --> C{Protected Route?}
    C -->|No| D["Allow"]
    C -->|Yes| E{Has Valid Token?}
    E -->|No Token| F["Redirect /login"]
    E -->|Expired| G["Try Refresh"]
    G --> H{Refresh Success?}
    H -->|Yes| I["Set Cookies, Allow"]
    H -->|No| J["Redirect /login"]
    E -->|Valid| D
```

## Token Flow

```mermaid
sequenceDiagram
    participant Client
    participant Middleware
    participant API_Route
    participant Backend
    participant Cookies

    Client->>API_Route: POST /api/auth/login
    API_Route->>Backend: Validate credentials
    Backend-->>API_Route: {token, refreshToken, user}
    API_Route->>Cookies: Set HTTP-only cookies
    API_Route-->>Client: {user}

    Note over Client: Cookies not accessible<br/>via JavaScript (XSS safe)

    Client->>Middleware: Request /write
    Middleware->>Middleware: Validate JWT
    Middleware->>Cookies: Check token
    Cookies-->>Middleware: Token valid
    Middleware->>Client: Allow
```

## Cookie vs localStorage

| Aspect | localStorage | HTTP-only Cookie |
|--------|-------------|------------------|
| XSS Access | Yes | No |
| Server Access | No | Yes |
| CSRF Protection | None | sameSite: lax |
| Middleware Integration | No | Yes |

## Key Design Decisions

```mermaid
classDiagram
    class Middleware {
        +isTokenValid(token)
        +protectedRoutes
        +publicRoutes
    }
    class AuthCookies {
        +getAccessToken()
        +getRefreshToken()
        +setAuthCookies()
        +clearAuthCookies()
    }
    class API_Route {
        +POST login
        +POST register
        +POST refresh
        +POST logout
        +GET me
    }

    Middleware --> AuthCookies
    API_Route --> AuthCookies
```

## Middleware Flow

```mermaid
flowchart TD
    A["Request"] --> B["Public route?"]
    B -->|Yes, has token| C["Redirect /"]
    B -->|Yes, no token| D["Allow"]
    B -->|No| E["Protected route?"]
    E -->|No| D
    E -->|Yes| F{"Has access token?"}
    F -->|No| G["Redirect /login?redirect=path"]
    F -->|Yes| H{"Token valid?"}
    H -->|Yes| D
    H -->|No, has refresh| I["Call /api/auth/refresh"]
    I --> J{"Success?"}
    J -->|Yes| K["Set new cookies"]
    K --> D
    J -->|No| L["Clear cookies"]
    L --> G
```

## Token Refresh Pattern

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Middleware
    participant Backend

    Client->>API: Request (expired token)
    API-->>Client: 401 Unauthorized
    Client->>Middleware: Request (with refresh token)
    Middleware->>Backend: POST /api/auth/refresh
    Backend-->>Middleware: {token, newRefreshToken}
    Middleware->>Middleware: Set new cookies
    Middleware->>API: Retry with new token
    API->>Backend: Request (new token)
    Backend-->>API: 200 OK
    API-->>Client: Response
```

## Files Modified

| File | Change |
|------|--------|
| `middleware.ts` | NEW - Route protection, JWT validation, refresh |
| `auth-cookies.ts` | NEW - Server-side cookie helpers |
| `login/route.ts` | NEW - Proxy backend, set cookies |
| `register/route.ts` | NEW - Proxy backend, set cookies |
| `refresh/route.ts` | NEW - Token refresh via cookies |
| `logout/route.ts` | NEW - Clear cookies + call backend |
| `me/route.ts` | NEW - Get user via cookies |
| `auth.ts` | Updated - Cookie-aware token retrieval |
| `api.ts` | Updated - 401 handling with refresh |
| `use-auth.tsx` | Updated - Async logout, new API routes |
| `(app)/layout.tsx` | Simplified - middleware handles protection |

## Key Insight

Middleware intercepts requests BEFORE rendering. If `/write` is accessed without a valid token, user is redirected to `/login` immediately — no flash of protected content. Combined with HTTP-only cookies, this provides defense-in-depth against token theft.
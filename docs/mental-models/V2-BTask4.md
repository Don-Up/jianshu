# Mental Model: Task 4 - Security Enhancements

## Key Takeaway

Three layers of defense: **Rate Limiting** prevents abuse, **Helmet** sets secure HTTP headers, **Request Logging** enables monitoring. Together they protect the API from common attacks and provide observability.

## Architecture

```mermaid
flowchart TB
    subgraph "Request Pipeline"
        A["Client Request"] --> B["Helmet<br/>Security Headers"]
        B --> C["ThrottlerGuard<br/>Rate Limit Check"]
        C --> D["LoggingMiddleware<br/>Request Log"]
        D --> E["Controller"]
    end

    subgraph "Security Headers (Helmet)"
        F["X-XSS-Protection"]
        G["X-Content-Type-Options"]
        H["X-Frame-Options"]
        I["Strict-Transport-Security"]
    end

    B --> F
    B --> G
    B --> H
    B --> I
```

## Rate Limiting Flow

```mermaid
sequenceDiagram
    participant Client
    participant ThrottlerGuard
    participant Controller

    Client->>ThrottlerGuard: Request /api/articles
    ThrottlerGuard->>ThrottlerGuard: Check: 1 request
    ThrottlerGuard->>Controller: Pass
    Controller-->>Client: Response

    Client->>ThrottlerGuard: Request /api/articles
    ThrottlerGuard->>ThrottlerGuard: Check: 2 requests
    ThrottlerGuard->>ThrottlerGuard: Check: ... < 100
    ThrottlerGuard->>Controller: Pass

    Client->>ThrottlerGuard: Request /api/articles (101st)
    ThrottlerGuard->>ThrottlerGuard: Check: 101 > 100
    ThrottlerGuard-->>Client: 429 Too Many Requests
```

## Logging Middleware

```mermaid
classDiagram
    class LoggingMiddleware {
        +Logger logger
        +use(req, res, next)
    }

    class Request {
        +method: string
        +originalUrl: string
        +ip: string
        +get(user-agent): string
    }

    class Response {
        +statusCode: number
        +get(content-length): string
        +on(finish, callback)
    }

    LoggingMiddleware --> Request
    LoggingMiddleware --> Response
```

## Key Design Decisions

| Feature | Config | Why |
|---------|--------|-----|
| Rate Limit | 100 req/min | Prevents brute-force & DoS |
| TTL | 60 seconds | Sliding window per minute |
| Helmet | Default middleware | 11 security headers automatically |
| CORS | Env variable | Flexible deployment |

## Code: Global Guard Pattern

```typescript
// app.module.ts - Rate limiter as global guard
@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
```

## Security Headers Set by Helmet

| Header | Protection |
|--------|------------|
| X-XSS-Protection | XSS filtering |
| X-Content-Type-Options | MIME sniffing prevention |
| X-Frame-Options | Clickjacking prevention |
| Strict-Transport-Security | Force HTTPS |

## Log Format

```
METHOD /originalUrl STATUS SIZEb - DURATIONms - IP USER_AGENT
GET /api/articles 200 100b - 15ms - 127.0.0.1 Mozilla/5.0
```
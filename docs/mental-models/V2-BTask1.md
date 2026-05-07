# Mental Model: Task 1 - Comments Module

## Key Takeaway

Comments are a **nested resource under articles** — accessed via `/articles/:articleId/comments`. The CommentsService handles create/list/delete while ArticlesController delegates comment routes. Comment counts are denormalized on the Article model (`commentCount`) for performance.

## Data Flow

```mermaid
sequenceDiagram
    participant Client
    participant CommentsController
    participant CommentsService
    participant Prisma

    Client->>CommentsController: POST /articles/:articleId/comments
    CommentsController->>CommentsService: create(articleId, userId, dto)
    CommentsService->>Prisma: article.findUnique(id)
    CommentsService->>Prisma: comment.create()
    CommentsService->>Prisma: article.update(commentCount + 1)
    CommentsService-->>Client: { success: true, data: comment }

    Client->>CommentsController: GET /articles/:articleId/comments?page=1&limit=20
    CommentsController->>CommentsService: findByArticle(articleId, query)
    CommentsService->>Prisma: comment.findMany + comment.count
    CommentsService-->>Client: { items: [], total, page, totalPages }
```

## Module Structure

```mermaid
classDiagram
    class CommentsModule {
        <<module>>
        +CommentsController
        +CommentsService
    }

    class CommentsController {
        +findAll(articleId, query)
        +create(articleId, user, dto)
        +delete(id, user)
    }

    class CommentsService {
        +create(articleId, authorId, dto)
        +findByArticle(articleId, query)
        +delete(commentId, userId)
    }

    class CreateCommentDto {
        +content: string
    }

    CommentsModule --> CommentsController
    CommentsModule --> CommentsService
    CommentsService --> CreateCommentDto
```

## Route Pattern

```mermaid
flowchart LR
    A["/articles/:articleId/comments"] -->|GET| B[List comments]
    A -->|POST| C[Create comment]
    D["/comments/:id"] -->|DELETE| E[Delete comment]
```

## Key Design Decisions

| Pattern | Why |
|---------|-----|
| Route: `/articles/:articleId/comments` | RESTful nested resource - comments belong to articles |
| Denormalized `commentCount` on Article | Avoid JOIN on every article list query |
| `articleId` as route param, not body | Cleaner URLs, article ID always required |
| `authorId` from `@CurrentUser()` | Authenticated action - user ID from JWT, not request body |

## Code Snippet: Controller Delegation

```typescript
@ApiTags('comments')
@Controller('articles/:articleId/comments')  // Nested route
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('articleId') articleId: string,  // Extract from route
    @CurrentUser() user: User,              // Authenticated user
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(articleId, user.id, dto);
  }
}
```
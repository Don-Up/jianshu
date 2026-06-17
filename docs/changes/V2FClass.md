# V2 Frontend 类关系图

## 1. API 层 (`apps/web/src/lib/api.ts`)

```mermaid
classDiagram
    direction LR

    class fetchApi~T~ {
        <<function>>
        +endpoint: string
        +options: RequestInit
        +token: string
        +headers: HeadersInit
        +res: Response
        +data: ApiResponse~T~
        +call(): Promise~ApiResponse~T~~
    }

    class authApi {
        <<object>>
        +login(data: LoginRequest): Promise
        +register(data: RegisterRequest): Promise
        +me(): Promise
        +logout(): Promise
    }

    class articleApi {
        <<object>>
        +list(params?): Promise
        +getBySlug(slug): Promise
        +create(data): Promise
        +update(slug, data): Promise
        +delete(slug): Promise
        +like(slug): Promise
        +bookmark(slug): Promise
    }

    class commentApi {
        <<object>>
        +list(articleId, params?): Promise
        +create(articleId, data): Promise
        +delete(articleId, commentId): Promise
    }

    class notificationApi {
        <<object>>
        +list(params?): Promise
        +markAsRead(id): Promise
        +markAllAsRead(): Promise
    }

    class userApi {
        <<object>>
        +getByUsername(username): Promise
        +follow(userId): Promise
        +getArticles(username, params?): Promise
    }

    fetchApi <-- authApi : uses
    fetchApi <-- articleApi : uses
    fetchApi <-- commentApi : uses
    fetchApi <-- notificationApi : uses
    fetchApi <-- userApi : uses
```

## 2. Hooks 层 (`apps/web/src/hooks/`)

```mermaid
classDiagram
    direction LR

    class useAuth {
        <<hook>>
        +user: User
        +isAuthenticated: boolean
        +isLoading: boolean
        +login(email, password): Promise
        +register(data): Promise
        +logout(): Promise
    }

    class useComments {
        <<hook>>
        +comments: Comment[]
        +isLoading: boolean
        +error: string | null
        +hasMore: boolean
        +loadComments(articleId, page): Promise
        +createComment(articleId, content): Promise
        +deleteComment(articleId, commentId): Promise
        +loadMore(): Promise
    }

    class useSearch {
        <<hook>>
        +articles: ArticleWithAuthor[]
        +isLoading: boolean
        +error: string | null
        +hasMore: boolean
        +loadMore(): Promise
    }

    class useNotifications {
        <<hook>>
        +notifications: Notification[]
        +total: number
        +unreadCount: number
        +isLoading: boolean
        +markAsRead(id): void
        +markAllAsRead(): void
    }

    useAuth ..> authApi : calls
    useComments ..> commentApi : calls
    useSearch ..> articleApi : calls
    useNotifications ..> notificationApi : calls
```

## 3. 组件层 (Comments)

```mermaid
classDiagram
    direction LR

    class CommentsSection {
        <<component>>
        +articleId: string
        +user: User
        +comments: Comment[]
        +isLoading: boolean
        +hasMore: boolean
        +isSubmitting: boolean
        +deletingId: string | null
        +handleSubmit(content): Promise
        +handleDelete(commentId): Promise
    }

    class CommentForm {
        <<component>>
        +onSubmit: function
        +isSubmitting: boolean
        +content: string
        +handleSubmit(): Promise
    }

    class CommentList {
        <<component>>
        +comments: Comment[]
        +hasMore: boolean
        +isLoading: boolean
        +onDelete: function
        +onLoadMore: function
    }

    class CommentItem {
        <<component>>
        +comment: Comment
        +onDelete: function
        +canDelete: boolean
        +handleDelete(): Promise
    }

    CommentsSection o-- CommentForm : renders
    CommentsSection o-- CommentList : renders
    CommentList o-- CommentItem : renders
    CommentsSection ..> useComments : uses
```

## 4. 组件层 (Search)

```mermaid
classDiagram
    direction LR

    class Header {
        <<component>>
        +user: User
        +isAuthenticated: boolean
    }

    class SearchBar {
        <<component>>
        +query: string
        +handleSubmit(e): void
        +handleKeyDown(e): void
    }

    class SearchInput {
        <<component>>
        +query: string
        +results: ArticleWithAuthor[]
        +isLoading: boolean
        +isOpen: boolean
        +searchArticles(query): Promise
        +handleResultClick(slug): void
    }

    class SearchPage {
        <<component>>
        +query: string
        +articles: ArticleWithAuthor[]
        +isLoading: boolean
        +hasMore: boolean
    }

    Header o-- SearchBar : uses
    Header o-- SearchInput : uses
    SearchPage ..> useSearch : uses
    SearchInput ..> articleApi : calls
    SearchBar ..> useRouter : uses
```

## 5. 组件层 (Notifications)

```mermaid
classDiagram
    direction LR

    class NotificationsPage {
        <<page>>
    }

    class NotificationList {
        <<component>>
        +notifications: Notification[]
        +isLoading: boolean
        +unreadCount: number
        +markAsRead(id): void
        +markAllAsRead(): void
    }

    NotificationsPage o-- NotificationList : renders
    NotificationList ..> useNotifications : uses
```

## 6. 共享类型 (`packages/shared/src/index.ts`)

```mermaid
classDiagram
    direction LR

    class User {
        <<interface>>
        +id: string
        +email: string
        +name: string
        +username: string
        +avatar?: string | null
        +bio?: string | null
        +followerCount?: number
        +followingCount?: number
        +articleCount?: number
        +createdAt: Date
    }

    class Article {
        <<interface>>
        +id: string
        +title: string
        +slug: string
        +content: string
        +excerpt?: string
        +coverImage?: string | null
        +author: User
        +tags: string[]
        +likeCount: number
        +commentCount: number
        +readCount: number
        +isLiked?: boolean
        +isBookmarked?: boolean
        +createdAt: Date
        +updatedAt: Date
    }

    class Comment {
        <<interface>>
        +id: string
        +content: string
        +createdAt: Date
        +author: Pick~User~
    }

    class Notification {
        <<interface>>
        +id: string
        +type: 'COMMENT' | 'LIKE' | 'FOLLOW' | 'SYSTEM'
        +message: string
        +link?: string | null
        +isRead: boolean
        +createdAt: Date
        +actor?: Pick~User~ | null
        +article?: ArticleRef | null
    }

    class ArticleWithAuthor {
        <<interface>>
        +author: User
    }

    class ApiResponse~T~ {
        <<interface>>
        +success: boolean
        +data?: T
        +error?: string
        +message?: string
    }

    class PaginatedResponse~T~ {
        <<interface>>
        +items: T[]
        +total: number
        +page: number
        +limit: number
        +totalPages: number
    }

    class PaginationParams {
        <<interface>>
        +page: number
        +limit: number
    }

    Article "1" --> "*" Comment : has
    Article "1" --> "*" User : liked by
    Notification "*" --> "0..1" User : actor
    Notification "*" --> "0..1" Article : article
    ArticleWithAuthor --|> Article : extends
    PaginatedResponse *-- PaginationParams : contains
```

## 7. 完整数据流

```mermaid
flowchart LR
    subgraph Pages
        SP[SearchPage]
        NP[NotificationsPage]
    end

    subgraph Components
        SB[SearchBar]
        SI[SearchInput]
        NL[NotificationList]
    end

    subgraph Hooks
        US[useSearch]
        UN[useNotifications]
    end

    subgraph API
        articleApi
        notificationApi
    end

    subgraph Types
        ArticleWithAuthor
        Notification
    end

    SB -->|router.push| SP
    SI -->|articleApi.list| articleApi
    SI -->|results| US
    SP -->|useSearch| US
    US -->|articleApi.list| articleApi
    US -->|articles| ArticleWithAuthor
    NP -->|useNotifications| UN
    NL -->|useNotifications| UN
    UN -->|notificationApi.list| notificationApi
    UN -->|notifications| Notification
```

## 8. 模块依赖总结

```mermaid
classDiagram
    direction TB

    class "pages/" {
        SearchPage
        NotificationsPage
    }

    class "components/" {
        SearchBar
        SearchInput
        NotificationList
        CommentList
        CommentForm
    }

    class "hooks/" {
        useSearch
        useNotifications
        useComments
    }

    class "lib/api.ts" {
        articleApi
        commentApi
        notificationApi
        authApi
        userApi
    }

    class "shared/types" {
        User
        Article
        Comment
        Notification
        ApiResponse
        PaginatedResponse
    }

    "pages/" --> "components/"
    "components/" --> "hooks/"
    "hooks/" --> "lib/api.ts"
    "hooks/" --> "shared/types"
    "lib/api.ts" --> "shared/types"
```

## 说明

- **实线箭头** (`-->`) 表示直接依赖或调用关系
- **虚线箭头** (`..>`) 表示类型引用或间接使用
- **填充圆** 表示 `uses` 或 `calls` 关系
- **空心圆** 表示 `extends` 或 `implements` 关系
- **组合关系** (`o--`) 表示组件内部渲染
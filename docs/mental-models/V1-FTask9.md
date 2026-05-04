# Mental Model: Task 9 User Profile Page

## Key Takeaway

User profile pages follow a **data-driven composition pattern**: the page fetches user data and articles in parallel, then composes reusable components (`ProfileHeader`, `ArticleList`) without coupling to specific API internals. Follow/unfollow state lives locally in the component for optimistic UI — no global state needed for read-heavy social features.

## Code Flow

```mermaid
sequenceDiagram
    participant User
    participant UserProfilePage as Page
    participant ProfileHeader as Component
    participant userApi as API

    User->>UserProfilePage:访问 /user/[username]
    UserProfilePage->>userApi: Promise.all(getByUsername, getArticles)
    userApi-->>UserProfilePage: profile + articles
    UserProfilePage->>ProfileHeader: render(user, isOwnProfile)
    ProfileHeader->>ProfileHeader: setIsFollowing(initialIsFollowing)

    User->>ProfileHeader: 点击"关注"
    ProfileHeader->>userApi: follow(userId)
    userApi-->>ProfileHeader: { isFollowing: true }
    ProfileHeader->>ProfileHeader: setIsFollowing(true)
```

## Component Hierarchy

```mermaid
graph TD
    A[UserProfilePage<br/>'/user/[username]'] --> B[ProfileHeader]
    A --> C[ArticleList]
    A --> D[PageLayout]
    B --> E[Avatar]
    B --> F[Button<br/>follow/unfollow]
    C --> G[ArticleCard<br/>x N]
    D --> H[Header]
    D --> I[Footer]
```

## Data Fetching Pattern

```mermaid
flowchart LR
    A[useEffect<br/>fetchData] --> B[Promise.all]
    B --> C[userApi.getByUsername]
    B --> D[userApi.getArticles]
    C --> E[setProfile]
    D --> F[setArticles]
    E & F --> G[isLoading = false]
```

## Class Structure (API Layer)

```mermaid
classDiagram
    class userApi {
        +getByUsername(username): Promise
        +getArticles(username, params): Promise
        +follow(userId): Promise
        +unfollow(userId): Promise
    }

    class ArticleWithAuthor {
        +id: string
        +title: string
        +author: User
        +tags: string[]
    }

    class User {
        +id: string
        +username: string
        +name: string
        +avatar: string
        +bio: string
        +followerCount: number
        +followingCount: number
    }

    userApi ..> ArticleWithAuthor : returns
    userApi ..> User : returns
```

## Key Mental Models

| Concept | Why | When |
|---------|-----|------|
| `Promise.all` for parallel fetch | Performance — no sequential waterfall | Both profile and articles needed |
| Local `isFollowing` state | Optimistic UI — instant feedback | No global follow state needed |
| `isOwnProfile` computed from auth | Security — users can't edit others | Edit button visibility |
| `username` from `useParams` | Dynamic routing — single component handles all users | Route parameter extraction |

## Code Snippet: Parallel Data Fetching

```typescript
const fetchData = async () => {
  setIsLoading(true);
  try {
    const [profileRes, articlesRes] = await Promise.all([
      userApi.getByUsername(username),
      userApi.getArticles(username, { page: 1, limit: 20 }),
    ]);

    if (profileRes.success && profileRes.data) {
      setProfile(profileRes.data);
    }
    if (articlesRes.success && articlesRes.data) {
      setArticles(articlesRes.data.items);
    }
  } finally {
    setIsLoading(false);
  }
};
```
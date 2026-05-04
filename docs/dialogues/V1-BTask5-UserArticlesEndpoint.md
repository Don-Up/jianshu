# V1-BTask5-User Articles Endpoint Dialogue

**Teacher:** Lily
**Student:** Alex

---

**Lily:** Today we'll implement the User Articles endpoint - this is what powers the profile page when you view someone's articles. Why do we need a separate endpoint for this instead of just using the main articles list?

**Alex:** Hmm, I guess the main articles list is for browsing all articles? And the user articles endpoint is specifically for viewing one person's published articles on their profile?

**Lily:** Exactly! The main list shows everything published with filters (search, tags, author). But when you click on someone's profile, you want to see just their articles in reverse chronological order. Let's break this into three parts. Ready?

**Alex:** Ready!

## Part 1: The getUserArticles Service Method

**Lily:** First, let's look at the method signature. What parameters do we need?

**Alex:** Username to identify which user, page and limit for pagination, and optionally the requestUserId?

**Lily:** Good. Why would we need the requestUserId?

**Alex:** To check if the current user has liked or bookmarked the articles? So they can see their own engagement status?

**Lily:** Right. Now, before we fetch articles, what must we do first?

**Alex:** Find the user by username first to make sure they exist.

**Lily:** Here's the first part:
```typescript
const user = await this.prisma.user.findUnique({
  where: { username },
});

if (!user) {
  throw new NotFoundException('User not found');
}
```

Why do we throw NotFoundException instead of returning an empty array?

**Alex:** Because if the username doesn't exist, there's nothing to show. It would be confusing to say "here are 0 articles" for a user that doesn't exist at all.

**Lily:** Good thinking. Now let's fetch the articles. What's different about this query compared to findAll in ArticlesService?

**Alex:** We filter by `authorId` and `published: true` - we only want this user's published articles.

**Lily:** Right. And we also need pagination. How do we calculate skip?

**Alex:** `skip = (page - 1) * limit` - standard pagination offset.

**Lily:** Here's the query:
```typescript
const [articles, total] = await Promise.all([
  this.prisma.article.findMany({
    where: { authorId: user.id, published: true },
    include: {
      author: {
        select: { id: true, username: true, name: true, avatar: true },
      },
      tags: { include: { tag: true } },
      likes: requestUserId ? { where: { userId: requestUserId } } : false,
      bookmarks: requestUserId ? { where: { userId: requestUserId } } : false,
    },
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
  }),
  this.prisma.article.count({ where: { authorId: user.id, published: true } }),
]);
```

Why do we use `Promise.all` here?

**Alex:** To run the findMany and count queries in parallel instead of sequentially? Faster performance.

**Lily:** Good. And why do we conditionally include likes and bookmarks?

**Alex:** To avoid unnecessary queries if the user isn't authenticated. If `requestUserId` is undefined, we set likes to `false` which means "don't include" in Prisma.

**Lily:** Correct! Prisma treats `false` as "don't include this relation". Now the response format - why do we map each article instead of returning them directly?

**Alex:** To format the data for the API response. We extract only what the frontend needs and transform tags from the junction table format to just an array of tag names.

**Lily:** Here's the mapping:
```typescript
items: articles.map((a) => ({
  id: a.id,
  title: a.title,
  slug: a.slug,
  content: a.content,
  excerpt: a.excerpt,
  coverImage: a.coverImage,
  likeCount: a.likeCount,
  commentCount: a.commentCount,
  readCount: a.readCount,
  createdAt: a.createdAt,
  updatedAt: a.updatedAt,
  author: a.author,
  tags: a.tags?.map((t) => t.tag.name) || [],
  isLiked: a.likes?.length > 0 || false,
  isBookmarked: a.bookmarks?.length > 0 || false,
})),
```

Why do we check `a.likes?.length > 0`?

**Alex:** Because the include returns an array. If there's at least one like, the user has liked it. Same for bookmarks.

**Lily:** Perfect. Now let's look at the controller.

## Part 1 Recap
> 1. Look up user by username first - throw NotFoundException if not found
> 2. Filter articles by `authorId` and `published: true` for profile page
> 3. Use `Promise.all` to parallelize findMany and count queries
> 4. Conditional includes for likes/bookmarks based on authentication
> 5. Map junction table tags to simple string arrays
> 6. Set `isLiked`/`isBookmarked` based on whether related records exist

---

## Part 2: The Controller Endpoint

**Lily:** Let's look at the controller route. What HTTP method and path should we use?

**Alex:** GET with `:username/articles` as the path.

**Lily:** Here's the decorator:
```typescript
@Get(':username/articles')
@UseGuards(OptionalJwtAuthGuard)
@ApiOperation({ summary: 'Get articles by username' })
@ApiQuery({ name: 'page', required: false, type: Number })
@ApiQuery({ name: 'limit', required: false, type: Number })
```

Why do we use `@UseGuards(OptionalJwtAuthGuard)` instead of `JwtAuthGuard`?

**Alex:** Because users should be able to view articles even if they're not logged in. The JWT is optional - if present, we use it to show like/bookmark status; if not, we just show public data.

**Lily:** Good. And what's `@CurrentUser() user?: JwtUser`?

**Alex:** The decorator to extract the current user from the request. It's optional because the guard doesn't require JWT - it just extracts it if present.

**Lily:** Right. The method signature:
```typescript
async getUserArticles(
  @Param('username') username: string,
  @Query('page') page?: number,
  @Query('limit') limit?: number,
  @CurrentUser() user?: JwtUser,
) {
  return this.usersService.getUserArticles(username, page || 1, limit || 20, user?.id);
}
```

Why do we use `page || 1` and `limit || 20`?

**Alex:** To provide default values. If the query param is not provided, we default to page 1 with 20 items per page.

**Lily:** Good. And notice we pass `user?.id` - this will be `undefined` if no user is logged in, which is exactly what our service method needs.

## Part 2 Recap
> 1. `GET /users/:username/articles` for user profile pages
> 2. `OptionalJwtAuthGuard` allows both authenticated and anonymous access
> 3. `@CurrentUser() user?: JwtUser` extracts user if JWT present, undefined otherwise
> 4. Default pagination values (page=1, limit=20) prevent null/undefined issues

---

## Part 3: Why This Is Different From ArticlesService.findAll

**Lily:** Let's think about why we need this endpoint when we already have ArticlesService.findAll. What's the key difference?

**Alex:** findAll is for the main articles feed with global search and filters. This is specifically for a user's profile page.

**Lily:** Right. When you view a profile page, what do you expect to see?

**Alex:** Just that person's articles, sorted by date, with no search bar filtering by tag or keyword.

**Lily:** What about authorization?

**Alex:** findAll with authorId filter could be used similarly, but getUserArticles is cleaner because it's scoped to the user profile context.

**Lily:** Here's the key difference in the queries:

**findAll in ArticlesService:**
```typescript
where: {
  published: true,
  // optional: authorId, tag, search
}
```

**getUserArticles:**
```typescript
where: { authorId: user.id, published: true }
```

Notice getUserArticles ALWAYS filters by authorId - there's no way to get all articles, it's strictly scoped to one user.

**Alex:** And getUserArticles doesn't support search or tag filtering?

**Lily:** Correct. Profile pages show all articles by that user. If you wanted search on a profile, you'd add it later as an enhancement.

**Alex:** So the architecture is: ArticlesService for the global feed with all features, UsersService.getUserArticles for the simple profile use case.

**Lily:** Exactly! Different contexts, different endpoints.

## Part 3 Recap
> 1. findAll is a global feed with search, tag filter, and optional author filter
> 2. getUserArticles is profile-specific - always scoped to one author, no search
> 3. Both return the same article structure with isLiked/isBookmarked
> 4. Service separation keeps concerns clear

---

## Part 4: Edge Cases

**Lily:** What happens if a user has no articles?

**Alex:** We return an empty items array with total=0. The frontend would show "No articles yet" or similar.

**Lily:** What if someone requests articles for a username that doesn't exist?

**Alex:** NotFoundException is thrown, which would return a 404 to the client.

**Lily:** What about private articles? Should those show on a profile?

**Alex:** No, we filter by `published: true`. Only published articles appear on profiles.

**Lily:** Good. What about performance - could this query be slow?

**Alex:** For users with thousands of articles, the query could be slow. But we have pagination so we only fetch 20 at a time. The count query might be heavy for very popular users.

**Lily:** Right. For a real production app, you'd want to cache popular user article counts. But for MVP, this is fine.

## Part 4 Recap
> 1. Empty articles returns empty array with total=0, not an error
> 2. Non-existent username throws 404 NotFoundException
> 3. Only `published: true` articles appear on profiles
> 4. Pagination limits query size even for prolific authors

---

### Summary

**Lily:** Let's wrap up the User Articles endpoint. What are the key concepts?

**Alex:**
1. `getUserArticles` in UsersService fetches published articles for a specific user
2. Uses `authorId` filter and `published: true` always
3. Conditional includes for likes/bookmarks based on optional JWT
4. `GET /users/:username/articles` endpoint with OptionalJwtAuthGuard
5. Pagination with defaults (page=1, limit=20)
6. Different from findAll which is a global feed with search and filters

**Lily:** Perfect! The User Articles endpoint is a focused, profile-specific query. Simple and efficient for its use case.

---

### Quick Reference: Endpoint

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /users/:username/articles | Optional | Get user's published articles with pagination |

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```
# V1-BTask4-Articles Module Dialogue

**Teacher:** Lily
**Student:** Alex

---

**Lily:** Today we'll implement the Articles module - the core of our blogging platform. This handles creating articles, listing them, viewing individual articles, and social features like likes and bookmarks. Let's break it into five parts. Ready to dive in?

**Alex:** Ready! What's the first part?

## Part 1: Article Creation with Tags

**Lily:** Let's start with creation. When a user creates an article, what data do we need?

**Alex:** Title, content, maybe an excerpt and cover image, and tags?

**Lily:** Good. And how do we generate a URL-friendly identifier for each article?

**Alex:** A slug. We could just use the title converted to lowercase with hyphens.

**Lily:** Exactly, but we need to handle duplicates. What if two users create "Hello World"?

**Alex:** We need unique slugs. Maybe add a random suffix?

**Lily:** Perfect. Here's how we generate it:

```typescript
private generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9一-龥]+/g, '-')
    .replace(/^-|-$/g, '');
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${suffix}`;
}
```

Now, tags are many-to-many. How should we handle them if a tag doesn't exist yet?

**Alex:** We need to create it if it doesn't exist, or connect it if it does. That's connectOrCreate!

**Lily:** Right. Here's the create logic:

```typescript
tags: dto.tags && dto.tags.length > 0
  ? {
      create: dto.tags.map((name) => ({
        tag: {
          connectOrCreate: {
            where: { name },
            create: { name },
          },
        },
      })),
    }
  : undefined,
```

Why do we use `create` with nested `connectOrCreate` instead of just connecting?

**Alex:** Because the tag might not exist in the database yet.

**Lily:** Good thinking. Now, what should the response include?

**Alex:** The created article with author info and tags.

**Lily:** We use `include` to fetch related data efficiently. Let's move to listing.

## Part 1 Recap
> 1. Slugs must be unique - add random suffix to handle duplicates
> 2. Tags use connectOrCreate to handle both new and existing tags
> 3. Include author and tags in the response with Prisma's `include`

---

## Part 2: Article Listing with Pagination

**Lily:** When listing articles, what challenges do we face?

**Alex:** There could be thousands of articles, so we need pagination.

**Lily:** Right. And what about searching and filtering?

**Alex:** Users might want to filter by author, tag, or search in title/content.

**Lily:** Here's how we build the where clause:

```typescript
const where: any = { published: true };

if (authorId) {
  where.authorId = authorId;
}

if (tag) {
  where.tags = {
    some: {
      tag: {
        name: tag,
      },
    },
  };
}

if (search) {
  where.OR = [
    { title: { contains: search, mode: 'insensitive' } },
    { content: { contains: search, mode: 'insensitive' } },
  ];
}
```

Why do we use `where.OR` instead of just filtering once?

**Alex:** Because search should match either title OR content, not necessarily both.

**Lily:** Excellent. And for pagination, how do we calculate what to skip?

**Alex:** `skip = (page - 1) * limit`

**Lily:** Right. We also return `totalPages` so the frontend knows how many pages exist. Now let's look at individual articles.

## Part 2 Recap
> 1. Pagination uses `skip` and `take` with calculated offset
> 2. Filters are additive - each filter adds a condition to `where`
> 3. Search uses `OR` for title/content matching
> 4. Always filter by `published: true` unless specifically querying drafts

---

## Part 3: Article View with Read Count

**Lily:** When a user views an article by slug, what should we include?

**Alex:** The article content, author info, tags, and whether the current user liked or bookmarked it.

**Lily:** Right. And we also increment the read count. Why is this separate from the initial query?

**Alex:** To avoid slowing down the response? We don't need the updated read count in the response.

**Lily:** Exactly. We fire and forget the update:

```typescript
await this.prisma.article.update({
  where: { id: article.id },
  data: { readCount: { increment: 1 } },
});
```

Why do we increment `readCount` separately rather than including it in the findUnique?

**Alex:** Because findUnique returns the old value, and if we wanted real-time accurate counts, we'd need a transaction. But for performance, separate update is fine.

**Lily:** Good insight. Now, authorization for editing - what should happen if user A tries to edit user B's article?

**Alex:** We should throw ForbiddenException.

**Lily:** Right. Let's look at the update method:

```typescript
if (article.authorId !== userId) {
  throw new ForbiddenException('Not authorized to update this article');
}
```

This check happens before any modification. Why is that important?

**Alex:** To avoid unnecessary database operations and to fail fast.

## Part 3 Recap
> 1. `findBySlug` fetches article with author, tags, likes, bookmarks in one query
> 2. `readCount` increments asynchronously - doesn't block response
> 3. Authorization check happens before any write operation
> 4. 404 if article doesn't exist, 403 if not the author

---

## Part 4: Like Toggle

**Lily:** The like feature is another toggle operation. How do we know if a user already liked an article?

**Alex:** We check the Like table with both userId and articleId.

**Lily:** Right. Here's the pattern:

```typescript
const existingLike = await this.prisma.like.findUnique({
  where: {
    userId_articleId: {
      userId,
      articleId: article.id,
    },
  },
});

if (existingLike) {
  await this.prisma.like.delete(...);
  await this.prisma.article.update({
    data: { likeCount: { decrement: 1 } },
  });
  return { success: true, data: { likeCount: newCount, isLiked: false } };
} else {
  await this.prisma.like.create(...);
  await this.prisma.article.update({
    data: { likeCount: { increment: 1 } },
  });
  return { success: true, data: { likeCount: newCount, isLiked: true } };
}
```

What race condition could happen here?

**Alex:** If a user clicks like twice quickly, two requests might both see "no existing like" and both try to create... or both delete.

**Lily:** In practice for MVP this is fine, but production would use a transaction or idempotency key. For now, this toggle pattern works. Notice we update `likeCount` in the Article table - why?

**Alex:** So we can show the count without expensive joins.

**Lily:** Right. `likeCount` is denormalized for performance. Now bookmark follows the same pattern.

## Part 4 Recap
> 1. Toggle pattern: check existence → create or delete
> 2. `likeCount` stored denormalized on Article for fast reads
> 3. Return both new count and `isLiked`/`isBookmarked` state
> 4. Race conditions possible but acceptable for MVP

---

## Part 5: Query Articles by User

**Lily:** There's actually another way to get articles - from the Users module. When viewing a user's profile, we fetch their articles too. How is this different from the main articles list?

**Alex:** It's filtered by author and only shows published articles.

**Lily:** Right. And it includes the same social indicators (isLiked, isBookmarked) for the current user if authenticated. Here's the key query:

```typescript
const [articles, total] = await Promise.all([
  this.prisma.article.findMany({
    where: { authorId: user.id, published: true },
    include: {
      author: { select: {...} },
      tags: { include: { tag: true } },
      likes: requestUserId ? { where: { userId: requestUserId } } : false,
      bookmarks: requestUserId ? { where: { userId: requestUserId } } : false,
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
  }),
  this.prisma.article.count({ where: { authorId: user.id, published: true } }),
]);
```

Why do we conditionally include likes/bookmarks only when `requestUserId` exists?

**Alex:** To avoid unnecessary queries if the user isn't authenticated anyway.

**Lily:** Good optimization. Any questions about the Articles module?

**Alex:** How do tags work across multiple articles? If article A has tag "react" and article B also has tag "react", do we create two tag records?

**Lily:** Great question. No - there's one Tag record per unique name, linked via the junction table `TagsOnArticles`. This is why we use `connectOrCreate` - it connects to existing tags or creates new ones, but never duplicates.

## Part 5 Recap
> 1. User articles query filters by `authorId` and `published: true`
> 2. Conditional includes for likes/bookmarks based on authentication
> 3. One Tag record per unique name, shared across articles via junction table
> 4. `connectOrCreate` prevents duplicate tags

---

### Summary

**Lily:** Let's wrap up the Articles module. What are the key concepts?

**Alex:** 
1. Slug generation with random suffix for uniqueness
2. Tags via many-to-many with connectOrCreate
3. Pagination with skip/take and total count
4. Search filters using OR conditions
5. Read count denormalized for performance
6. Toggle pattern for like/bookmark
7. Authorization checks before mutations

**Lily:** Perfect. The Articles module is the heart of the platform - it handles content creation, discovery, and social interactions. Well done!

---

### Quick Reference: Articles Service Methods

| Method | Purpose |
|--------|---------|
| `create` | Create article with tags, auto-generate slug |
| `findAll` | List with pagination, search, filter by author/tag |
| `findBySlug` | Get single article, increment readCount |
| `update` | Modify article, handle tag changes |
| `delete` | Remove article (authorization required) |
| `like` | Toggle like with count update |
| `bookmark` | Toggle bookmark (no count update needed) |

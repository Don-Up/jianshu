# V1-BTask3-Users Module Dialogue

**Teacher:** Lily
**Student:** Alex

---

**Lily:** Today we'll implement the Users module for our Jianshu API. This module handles user profiles, social connections, and fetching user content. Let's break it down into three parts: profile management, follow system, and content retrieval. Ready?

**Alex:** Ready! What's the first part?

## Part 1: Profile Management

**Lily:** First, let's talk about how users are retrieved. When you want to see someone's profile, you search by username. What happens if the username doesn't exist?

**Alex:** Should we return an error?

**Lily:** Exactly. We throw a `NotFoundException`. Here's the service method:

```typescript
async findByUsername(username: string) {
  const user = await this.prisma.user.findUnique({
    where: { username },
    include: {
      _count: {
        select: {
          articles: true,
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  const { password, ...result } = user;
  return {
    success: true,
    data: {
      ...result,
      articleCount: user._count.articles,
      followerCount: user._count.followers,
      followingCount: user._count.following,
    },
  };
}
```

Notice we use `_count` to efficiently get aggregate numbers. And we exclude the password field. Why do you think that's important?

**Alex:** Because passwords should never be sent to the client, even hashed ones.

**Lily:** Good. Now, for updating profiles. Which endpoint do we use?

**Alex:** PATCH `/api/users/me` with a body like `{"name": "New Name", "bio": "Hello"}`.

**Lily:** Perfect. The DTO looks like this:

```typescript
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  bio?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}
```

And since this modifies user data, what do we need?

**Alex:** Authentication. So it requires the JWT guard.

**Lily:** Right. Now let's move to the follow system.

## Part 2: Follow System

**Lily:** The follow system is a many-to-many relationship between users. How do we prevent a user from following themselves?

**Alex:** We check if `followerId === followingId` and return an error if true.

**Lily:** Good. Here's the follow toggle logic:

```typescript
async follow(followerId: string, followingId: string) {
  if (followerId === followingId) {
    return { success: false, error: 'Cannot follow yourself' };
  }

  const following = await this.prisma.user.findUnique({
    where: { id: followingId },
  });

  if (!following) {
    throw new NotFoundException('User not found');
  }

  const existingFollow = await this.prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId, followingId },
    },
  });

  if (existingFollow) {
    await this.prisma.follow.delete({
      where: { followerId_followingId: { followerId, followingId } },
    });
    return { success: true, data: { isFollowing: false } };
  } else {
    await this.prisma.follow.create({
      data: { followerId, followingId },
    });
    return { success: true, data: { isFollowing: true } };
  }
}
```

And when following/unfollowing, what do we return?

**Alex:** We return `{"isFollowing": true}` or `{"isFollowing": false}` to show the new state.

**Lily:** Right. This is called a toggle operation. Can you think of why we use `findUnique` first?

**Alex:** To check if the relationship exists, so we know whether to create or delete it.

**Lily:** Excellent. Now the last part: content retrieval.

## Part 3: Content Retrieval

**Lily:** When fetching a user's articles, what should we include?

**Alex:** The article data with author info, tags, and whether the current user has liked or bookmarked each article.

**Lily:** Right. Here's the key part of the service method:

```typescript
const [articles, total] = await Promise.all([
  this.prisma.article.findMany({
    where: { authorId: user.id, published: true },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
        },
      },
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

We use `include` to fetch related data efficiently. And we handle pagination with `skip` and `take`. What happens if the user has no articles?

**Alex:** We return an empty `items` array with `total: 0`.

**Lily:** Correct. Now, there's also endpoints for followers and following lists. They return paginated user objects. Any questions about the module?

**Alex:** How do we handle the case where someone tries to follow a non-existent user?

**Lily:** We check if the user exists first with `findUnique`. If not, throw `NotFoundException`. This prevents orphaned follow records.

**Alex:** Got it. So the flow is: validate user → check existing follow → toggle relationship.

**Lily:** Exactly. That's the Users module.

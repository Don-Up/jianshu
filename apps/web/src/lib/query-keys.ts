// Query key factory for consistent cache management
export const queryKeys = {
  // Auth
  auth: ['auth'] as const,
  authMe: () => [...queryKeys.auth, 'me'] as const,

  // Articles
  articles: ['articles'] as const,
  article: (slug: string) => [...queryKeys.articles, slug] as const,

  // Users
  users: ['users'] as const,
  user: (username: string) => [...queryKeys.users, username] as const,
  userArticles: (username: string) => [...queryKeys.users, username, 'articles'] as const,

  // Notifications
  notifications: ['notifications'] as const,

  // Comments
  comments: (slug: string) => ['comments', slug] as const,

  // Collections
  collections: ['collections'] as const,
  collection: (id: string) => [...queryKeys.collections, id] as const,
  bookmarks: ['collections', 'bookmarks'] as const,

  // Versions
  versions: (slug: string) => ['versions', slug] as const,

  // History
  history: ['history'] as const,

  // Feed
  feed: ['feed'] as const,
  homeFeed: () => [...queryKeys.feed, 'home'] as const,
  recommendedFeed: () => [...queryKeys.feed, 'recommended'] as const,

  // Drafts
  drafts: ['drafts'] as const,
};

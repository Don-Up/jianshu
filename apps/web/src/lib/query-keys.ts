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
};

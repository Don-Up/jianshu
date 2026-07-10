import type {
  ApiResponse,
  Article,
  User,
  LoginRequest,
  RegisterRequest,
  CreateArticleRequest,
  ArticleListParams,
  CreateCommentRequest,
  CommentListParams,
  Notification,
} from '@jianshu/shared';
import type { ArticleListResponse, ArticleWithAuthor, CommentListResponse } from '@/types';
import type { PaginatedResponse } from '@jianshu/shared';
import { getToken } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const REFRESH_TOKEN_COOKIE = 'jianshu_refresh_token';

async function refreshTokens(): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  const match = document.cookie.match(new RegExp('(^| )' + REFRESH_TOKEN_COOKIE + '=([^;]+)'));
  const refreshToken = match ? decodeURIComponent(match[2]) : null;
  if (!refreshToken) return false;

  try {
    const res = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options?.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (res.status === 401 && !(options?.headers as Record<string, string>)?.['x-retry']) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      (headers as Record<string, string>)['x-retry'] = 'true';
      const retryRes = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        credentials: 'include',
        headers,
      });
      if (retryRes.ok) {
        return retryRes.json();
      }
    }
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const authApi = {
  login: (data: LoginRequest) =>
    fetchApi<{ token: string; user: User }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: RegisterRequest) =>
    fetchApi<{ token: string; user: User }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => fetchApi<User>('/api/v1/auth/me'),

  logout: () => fetchApi<void>('/api/v1/auth/logout', { method: 'POST' }),
};

export const articleApi = {
  list: (params?: ArticleListParams) => {
    const searchParams = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';
    return fetchApi<ArticleListResponse>(
      `/api/v1/articles${searchParams ? `?${searchParams}` : ''}`
    );
  },

  getBySlug: (slug: string) =>
    fetchApi<ArticleWithAuthor>(`/api/v1/articles/${slug}`),

  create: (data: CreateArticleRequest) =>
    fetchApi<ArticleWithAuthor>('/api/v1/articles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (slug: string, data: Partial<CreateArticleRequest>) =>
    fetchApi<ArticleWithAuthor>(`/api/v1/articles/${slug}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (slug: string) =>
    fetchApi<void>(`/api/v1/articles/${slug}`, {
      method: 'DELETE',
    }),

  like: (slug: string) =>
    fetchApi<{ likeCount: number }>(`/api/v1/articles/${slug}/like`, {
      method: 'POST',
    }),

  bookmark: (slug: string) =>
    fetchApi<{ isBookmarked: boolean }>(`/api/v1/articles/${slug}/bookmark`, {
      method: 'POST',
    }),
};

export interface ArticleVersion {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  version: number;
  createdAt: string;
}

export const versionsApi = {
  list: (slug: string) =>
    fetchApi<ArticleVersion[]>(`/api/v1/articles/${slug}/versions`),

  get: (slug: string, versionId: string) =>
    fetchApi<ArticleVersion>(`/api/v1/articles/${slug}/versions/${versionId}`),

  restore: (slug: string, versionId: string) =>
    fetchApi<void>(`/api/v1/articles/${slug}/versions/${versionId}/restore`, {
      method: 'POST',
    }),
};

export const userApi = {
  getByUsername: (username: string) =>
    fetchApi<User>(`/api/v1/users/${username}`),

  updateProfile: (data: { name?: string; bio?: string; avatar?: string }) =>
    fetchApi<User>('/api/v1/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    fetchApi<void>('/api/v1/users/me/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  follow: (userId: string) =>
    fetchApi<{ isFollowing: boolean }>(`/api/v1/users/${userId}/follow`, {
      method: 'POST',
    }),

  getArticles: (username: string, params?: ArticleListParams) => {
    const searchParams = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';
    return fetchApi<ArticleListResponse>(
      `/api/v1/users/${username}/articles${searchParams ? `?${searchParams}` : ''}`
    );
  },

  getFollowers: (username: string, params?: { page?: number; limit?: number }) => {
    const searchParams = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';
    return fetchApi<PaginatedResponse<User>>(
      `/api/v1/users/${username}/followers${searchParams ? `?${searchParams}` : ''}`
    );
  },

  getFollowingStatus: (username: string) =>
    fetchApi<{ isFollowing: boolean }>(`/api/v1/users/${username}/following-status`),

  getFollowing: (username: string, params?: { page?: number; limit?: number }) => {
    const searchParams = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';
    return fetchApi<PaginatedResponse<User>>(
      `/api/v1/users/${username}/following${searchParams ? `?${searchParams}` : ''}`
    );
  },
};

export const commentApi = {
  list: (slug: string) => {
    return fetchApi<CommentListResponse>(
      `/api/v1/articles/${slug}/comments`
    );
  },

  create: (slug: string, data: CreateCommentRequest) =>
    fetchApi<Comment>(`/api/v1/articles/${slug}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (commentId: string) =>
    fetchApi<void>(`/api/v1/comments/${commentId}`, {
      method: 'DELETE',
    }),

  like: (commentId: string) =>
    fetchApi<{ success: boolean; data: { likeCount: number } }>(
      `/api/v1/comments/${commentId}/like`,
      { method: 'POST' }
    ),

  unlike: (commentId: string) =>
    fetchApi<{ success: boolean; data: { likeCount: number } }>(
      `/api/v1/comments/${commentId}/like`,
      { method: 'DELETE' }
    ),
};

export const notificationApi = {
  list: (params?: { page?: number; limit?: number }) => {
    const searchParams = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';
    return fetchApi<PaginatedResponse<Notification>>(
      `/api/v1/notifications${searchParams ? `?${searchParams}` : ''}`
    );
  },

  markAsRead: (id: string) =>
    fetchApi<void>(`/api/v1/notifications/${id}/read`, { method: 'POST' }),

  markAllAsRead: () =>
    fetchApi<void>('/api/v1/notifications/read-all', { method: 'POST' }),
};

export interface CollectionItem {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
}

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  articleCount: number;
  previewItems: CollectionItem[];
}

export const collectionsApi = {
  list: () => fetchApi<Collection[]>('/api/v1/collections'),

  getById: (id: string) => fetchApi<Collection>(`/api/v1/collections/${id}`),

  create: (data: { name: string; description?: string; isPublic?: boolean }) =>
    fetchApi<Collection>('/api/v1/collections', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { name?: string; description?: string; isPublic?: boolean }) =>
    fetchApi<Collection>(`/api/v1/collections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<void>(`/api/v1/collections/${id}`, { method: 'DELETE' }),

  addArticle: (collectionId: string, slug: string) =>
    fetchApi<void>(`/api/v1/collections/${collectionId}/articles/${slug}`, {
      method: 'POST',
    }),

  removeArticle: (collectionId: string, articleId: string) =>
    fetchApi<void>(`/api/v1/collections/${collectionId}/articles/${articleId}`, {
      method: 'DELETE',
    }),

  toggleBookmark: (slug: string) =>
    fetchApi<{ bookmarked: boolean }>(`/api/v1/collections/bookmark/${slug}`, {
      method: 'POST',
    }),

  getBookmarks: () => fetchApi<CollectionItem[]>('/api/v1/collections/bookmarks'),
};

export interface HistoryItem {
  article: ArticleWithAuthor;
  viewedAt: string;
}

export const historyApi = {
  getHistory: (params?: { page?: number; limit?: number }) => {
    const searchParams = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';
    return fetchApi<PaginatedResponse<HistoryItem>>(
      `/api/v1/users/me/history${searchParams ? `?${searchParams}` : ''}`
    );
  },

  removeFromHistory: (articleId: string) =>
    fetchApi<void>(`/api/v1/users/me/history/${articleId}`, {
      method: 'DELETE',
    }),

  clearHistory: () =>
    fetchApi<void>('/api/v1/users/me/history', {
      method: 'DELETE',
    }),

  recordView: (slug: string) =>
    fetchApi<void>(`/api/v1/articles/${slug}/view`, {
      method: 'POST',
    }),
};

export const feedApi = {
  getHomeFeed: (params?: { page?: number; limit?: number }) => {
    const searchParams = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';
    return fetchApi<PaginatedResponse<ArticleWithAuthor>>(
      `/api/v1/feed${searchParams ? `?${searchParams}` : ''}`
    );
  },

  getRecommendedFeed: (params?: { page?: number; limit?: number }) => {
    const searchParams = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';
    return fetchApi<PaginatedResponse<ArticleWithAuthor>>(
      `/api/v1/feed/recommended${searchParams ? `?${searchParams}` : ''}`
    );
  },
};
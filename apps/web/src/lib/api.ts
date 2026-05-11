import type {
  ApiResponse,
  Article,
  User,
  LoginRequest,
  RegisterRequest,
  CreateArticleRequest,
  ArticleListParams,
} from '@jianshu/shared';
import type { ArticleListResponse, ArticleWithAuthor } from '@/types';
import { getToken } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const REFRESH_TOKEN_COOKIE = 'jianshu_refresh_token';

async function refreshTokens(): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  const match = document.cookie.match(new RegExp('(^| )' + REFRESH_TOKEN_COOKIE + '=([^;]+)'));
  const refreshToken = match ? decodeURIComponent(match[2]) : null;
  if (!refreshToken) return false;

  try {
    const res = await fetch('/api/auth/refresh', {
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
    fetchApi<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: RegisterRequest) =>
    fetchApi<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => fetchApi<User>('/api/auth/me'),

  logout: () => fetchApi<void>('/api/auth/logout', { method: 'POST' }),
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
      `/api/articles${searchParams ? `?${searchParams}` : ''}`
    );
  },

  getBySlug: (slug: string) =>
    fetchApi<ArticleWithAuthor>(`/api/articles/${slug}`),

  create: (data: CreateArticleRequest) =>
    fetchApi<ArticleWithAuthor>('/api/articles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (slug: string, data: Partial<CreateArticleRequest>) =>
    fetchApi<ArticleWithAuthor>(`/api/articles/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (slug: string) =>
    fetchApi<void>(`/api/articles/${slug}`, {
      method: 'DELETE',
    }),

  like: (slug: string) =>
    fetchApi<{ likeCount: number }>(`/api/articles/${slug}/like`, {
      method: 'POST',
    }),

  bookmark: (slug: string) =>
    fetchApi<{ isBookmarked: boolean }>(`/api/articles/${slug}/bookmark`, {
      method: 'POST',
    }),
};

export const userApi = {
  getByUsername: (username: string) =>
    fetchApi<User>(`/api/users/${username}`),

  follow: (userId: string) =>
    fetchApi<{ isFollowing: boolean }>(`/api/users/${userId}/follow`, {
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
      `/api/users/${username}/articles${searchParams ? `?${searchParams}` : ''}`
    );
  },
};
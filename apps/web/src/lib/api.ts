import type {
  ApiResponse,
  Article,
  User,
  LoginRequest,
  RegisterRequest,
  CreateArticleRequest,
  UpdateArticleRequest,
  ArticleListParams,
} from '@jianshu/shared';
import type { ArticleListResponse, ArticleResponse } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('jianshu_token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const authApi = {
  login: (data: LoginRequest) =>
    fetchApi<ApiResponse<{ token: string; user: User }>>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: RegisterRequest) =>
    fetchApi<ApiResponse<{ token: string; user: User }>>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => fetchApi<ApiResponse<User>>('/api/auth/me'),

  logout: () => Promise.resolve(),
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
    ) as Promise<ArticleListResponse>;
  },

  getBySlug: (slug: string) =>
    fetchApi<ArticleResponse>(`/api/articles/${slug}`) as Promise<ArticleResponse>,

  create: (data: CreateArticleRequest) =>
    fetchApi<ArticleResponse>('/api/articles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (slug: string, data: Partial<CreateArticleRequest>) =>
    fetchApi<ArticleResponse>(`/api/articles/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (slug: string) =>
    fetchApi<ApiResponse>(`/api/articles/${slug}`, {
      method: 'DELETE',
    }),

  like: (slug: string) =>
    fetchApi<ApiResponse<{ likeCount: number }>>(`/api/articles/${slug}/like`, {
      method: 'POST',
    }),

  bookmark: (slug: string) =>
    fetchApi<ApiResponse<{ isBookmarked: boolean }>>(`/api/articles/${slug}/bookmark`, {
      method: 'POST',
    }),
};

export const userApi = {
  getByUsername: (username: string) =>
    fetchApi<ApiResponse<User>>(`/api/users/${username}`),

  follow: (userId: string) =>
    fetchApi<ApiResponse<{ isFollowing: boolean }>>(`/api/users/${userId}/follow`, {
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
    ) as Promise<ArticleListResponse>;
  },
};

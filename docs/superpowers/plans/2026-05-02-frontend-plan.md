# Jianshu Frontend MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimalist blogging platform frontend with Next.js 14 App Router, supporting article CRUD, user authentication, and reading experience.

**Architecture:** Next.js 14 with App Router, React Server Components for data fetching, client components for interactivity. API communication via fetch with typed responses from `@jianshu/shared`. TailwindCSS for styling with a clean, typography-focused design inspired by 简书.

**Tech Stack:** Next.js 14, React 18, TypeScript, TailwindCSS, React Hook Form, Zod (validation), @tanstack/react-query (future API state management)

---

## File Structure

```
apps/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout with providers
│   │   ├── page.tsx                      # Home page - article list
│   │   ├── globals.css                   # Global styles + Tailwind
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx            # Login page
│   │   │   └── register/page.tsx        # Register page
│   │   ├── (app)/
│   │   │   ├── layout.tsx               # Authenticated layout
│   │   │   ├── write/page.tsx          # Create/edit article
│   │   │   └── settings/page.tsx        # User settings
│   │   ├── article/[slug]/page.tsx      # Article detail page
│   │   └── user/[username]/page.tsx    # User profile page
│   ├── components/
│   │   ├── ui/                          # Reusable UI primitives
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── card.tsx
│   │   │   └── avatar.tsx
│   │   ├── article/                     # Article-related components
│   │   │   ├── article-card.tsx
│   │   │   ├── article-content.tsx
│   │   │   └── article-editor.tsx
│   │   ├── layout/                      # Layout components
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   └── sidebar.tsx
│   │   └── auth/                        # Auth-related components
│   │       ├── login-form.tsx
│   │       └── register-form.tsx
│   ├── lib/
│   │   ├── api.ts                       # API client functions
│   │   ├── auth.ts                      # Auth utilities
│   │   └── utils.ts                     # General utilities
│   ├── types/
│   │   └── index.ts                     # Frontend-specific types
│   └── hooks/
│       ├── use-auth.ts                  # Auth hook
│       └── use-article.ts                # Article hooks
├── package.json
├── tailwind.config.ts
├── next.config.js
└── tsconfig.json
```

---

## Task 1: Project Setup & UI Foundation

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/src/app/globals.css`
- Create: `apps/web/src/lib/utils.ts`
- Create: `apps/web/src/components/ui/button.tsx`
- Create: `apps/web/src/components/ui/input.tsx`
- Create: `apps/web/src/components/ui/textarea.tsx`
- Create: `apps/web/src/components/ui/card.tsx`
- Create: `apps/web/src/components/ui/avatar.tsx`

- [ ] **Step 1: Install TailwindCSS dependencies**

```bash
cd apps/web
pnpm add -D tailwindcss postcss autoprefixer @tailwindcss/typography
pnpm add clsx tailwind-merge
```

- [ ] **Step 2: Create tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          500: '#6b7280',
          700: '#374151',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
export default config;
```

- [ ] **Step 3: Update globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply text-gray-900 antialiased;
  }
}

@layer components {
  .prose-jianshu {
    @apply prose prose-lg max-w-none;
    @apply prose-headings:font-semibold prose-headings:text-gray-900;
    @apply prose-p:leading-relaxed prose-p:text-gray-700;
    @apply prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline;
    @apply prose-blockquote:border-l-primary-500 prose-blockquote:bg-gray-50 prose-blockquote:py-1;
  }
}
```

- [ ] **Step 4: Create utils.ts**

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9一-龥]+/g, '-')
    .replace(/^-|-$/g, '');
}
```

- [ ] **Step 5: Create button.tsx**

```typescript
'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-primary-600 text-white hover:bg-primary-700': variant === 'primary',
            'bg-gray-100 text-gray-900 hover:bg-gray-200': variant === 'secondary',
            'hover:bg-gray-100': variant === 'ghost',
          },
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 text-sm': size === 'md',
            'h-12 px-6 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
export { Button };
```

- [ ] **Step 6: Create input.tsx**

```typescript
'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
          'placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
export { Input };
```

- [ ] **Step 7: Create textarea.tsx**

```typescript
'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'flex min-h-[120px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
          'placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
          'disabled:cursor-not-allowed disabled:opacity-50 resize-y',
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';
export { Textarea };
```

- [ ] **Step 8: Create card.tsx**

```typescript
import { cn } from '@/lib/utils';

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className, children }: CardProps) {
  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white shadow-sm', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: CardProps) {
  return <div className={cn('border-b border-gray-100 px-6 py-4', className)}>{children}</div>;
}

export function CardContent({ className, children }: CardProps) {
  return <div className={cn('px-6 py-4', className)}>{children}</div>;
}

export function CardFooter({ className, children }: CardProps) {
  return <div className={cn('border-t border-gray-100 px-6 py-4', className)}>{children}</div>;
}
```

- [ ] **Step 9: Create avatar.tsx**

```typescript
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

export function Avatar({ src, alt, size = 'md', className }: AvatarProps) {
  const initials = alt.slice(0, 2).toUpperCase();

  if (!src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-primary-100 text-primary-600 font-medium',
          sizeClasses[size],
          className
        )}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn('rounded-full object-cover', sizeClasses[size], className)}
    />
  );
}
```

- [ ] **Step 10: Commit**

```bash
cd c:/Users/10691/Documents/GitHub/jianshu
git add apps/web/src/components/ui/*.tsx apps/web/src/lib/utils.ts apps/web/tailwind.config.ts apps/web/src/app/globals.css
git commit -m "feat(web): add UI foundation with Tailwind and primitive components"
```

---

## Task 2: API Client & Shared Types

**Files:**
- Modify: `packages/shared/src/index.ts`
- Create: `apps/web/src/lib/api.ts`
- Create: `apps/web/src/types/index.ts`

- [ ] **Step 1: Update shared types for frontend needs**

Modify `packages/shared/src/index.ts` to add:

```typescript
// Existing types remain...

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  username: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Article types
export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string | null;
  author: User;
  tags: string[];
  likeCount: number;
  commentCount: number;
  readCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateArticleRequest {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string[];
}

export interface UpdateArticleRequest extends Partial<CreateArticleRequest> {
  slug: string;
}

// Pagination
export interface ArticleListParams extends PaginationParams {
  authorId?: string;
  tag?: string;
  search?: string;
}
```

- [ ] **Step 2: Create frontend types**

Create `apps/web/src/types/index.ts`:

```typescript
import type { Article, User, ApiResponse, PaginatedResponse } from '@jianshu/shared';

// Extend with frontend-only types
export interface ArticleWithAuthor extends Article {
  author: User;
}

export type ArticleListResponse = PaginatedResponse<ArticleWithAuthor>;
export type ArticleResponse = ApiResponse<ArticleWithAuthor>;
```

- [ ] **Step 3: Create API client**

Create `apps/web/src/lib/api.ts`:

```typescript
import type { ApiResponse, Article, User, LoginRequest, RegisterRequest, CreateArticleRequest, UpdateArticleRequest, ArticleListParams } from '@jianshu/shared';
import type { ArticleListResponse, ArticleResponse } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

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
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

// Auth API
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

// Article API
export const articleApi = {
  list: (params?: ArticleListParams) => {
    const searchParams = params ? new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return fetchApi<ArticleListResponse>(`/api/articles${searchParams ? `?${searchParams}` : ''}`) as Promise<ArticleListResponse>;
  },

  getBySlug: (slug: string) =>
    fetchApi<ArticleResponse>(`/api/articles/${slug}`) as Promise<ArticleResponse>,

  create: (data: CreateArticleRequest) =>
    fetchApi<ArticleResponse>('/api/articles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (slug: string, data: UpdateArticleRequest) =>
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

// User API
export const userApi = {
  getByUsername: (username: string) =>
    fetchApi<ApiResponse<User>>(`/api/users/${username}`),

  follow: (userId: string) =>
    fetchApi<ApiResponse<{ isFollowing: boolean }>>(`/api/users/${userId}/follow`, {
      method: 'POST',
    }),

  getArticles: (username: string, params?: ArticleListParams) => {
    const searchParams = params ? new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return fetchApi<ArticleListResponse>(`/api/users/${username}/articles${searchParams ? `?${searchParams}` : ''}`) as Promise<ArticleListResponse>;
  },
};
```

- [ ] **Step 4: Create auth utilities**

Create `apps/web/src/lib/auth.ts`:

```typescript
import type { User } from '@jianshu/shared';

const TOKEN_KEY = 'jianshu_token';
const USER_KEY = 'jianshu_user';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function setUser(user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function clearAuth(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
```

- [ ] **Step 5: Commit**

```bash
cd c:/Users/10691/Documents/GitHub/jianshu
git add packages/shared/src/index.ts apps/web/src/lib/api.ts apps/web/src/lib/auth.ts apps/web/src/types/index.ts
git commit -m "feat(web): add API client and update shared types"
```

---

## Task 3: Auth Hook & Context

**Files:**
- Create: `apps/web/src/hooks/use-auth.ts`
- Create: `apps/web/src/components/auth/auth-provider.tsx`
- Modify: `apps/web/src/app/layout.tsx`

- [ ] **Step 1: Create use-auth hook**

Create `apps/web/src/hooks/use-auth.ts`:

```typescript
'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import type { User } from '@jianshu/shared';
import { authApi } from '@/lib/api';
import { getToken, getUser, setUser as saveUser, setToken, clearAuth, isAuthenticated } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, username: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (isAuthenticated()) {
        const savedUser = getUser();
        if (savedUser) {
          setUserState(savedUser);
        }
        try {
          const res = await authApi.me();
          if (res.success && res.data) {
            setUserState(res.data);
            saveUser(res.data);
          } else {
            clearAuth();
            setUserState(null);
          }
        } catch {
          clearAuth();
          setUserState(null);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    if (res.success && res.data) {
      setToken(res.data.token);
      setUserState(res.data.user);
      saveUser(res.data.user);
    } else {
      throw new Error(res.error || 'Login failed');
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, username: string) => {
    const res = await authApi.register({ email, password, name, username });
    if (res.success && res.data) {
      setToken(res.data.token);
      setUserState(res.data.user);
      saveUser(res.data.user);
    } else {
      throw new Error(res.error || 'Registration failed');
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUserState(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

- [ ] **Step 2: Create auth provider component**

Create `apps/web/src/components/auth/auth-provider.tsx`:

```typescript
'use client';

import { AuthProvider } from '@/hooks/use-auth';

export function AuthProviderWrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
```

- [ ] **Step 3: Update root layout**

Modify `apps/web/src/app/layout.tsx`:

```typescript
import type { Metadata } from 'next';
import { AuthProviderWrapper } from '@/components/auth/auth-provider';
import './globals.css';

export const metadata: Metadata = {
  title: '简书 - 创作你的创作',
  description: '一个优质的创作社区',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthProviderWrapper>{children}</AuthProviderWrapper>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/hooks/use-auth.ts apps/web/src/components/auth/auth-provider.tsx apps/web/src/app/layout.tsx
git commit -m "feat(web): add auth context and use-auth hook"
```

---

## Task 4: Header & Layout Components

**Files:**
- Create: `apps/web/src/components/layout/header.tsx`
- Create: `apps/web/src/components/layout/footer.tsx`
- Modify: `apps/web/src/app/page.tsx`

- [ ] **Step 1: Create header component**

Create `apps/web/src/components/layout/header.tsx`:

```typescript
'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary-600">简书</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
              发现
            </Link>
            <Link href="/following" className="text-sm text-gray-600 hover:text-gray-900">
              关注
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link href="/write">
                <Button variant="primary" size="sm">
                  写文章
                </Button>
              </Link>
              <div className="relative group">
                <button className="flex items-center gap-2">
                  <Avatar src={user?.avatar} alt={user?.name || 'User'} size="sm" />
                </button>
                <div className="absolute right-0 top-full mt-1 w-48 rounded-md border border-gray-200 bg-white shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="py-1">
                    <Link
                      href={`/user/${user?.username}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      我的主页
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      设置
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      退出
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  登录
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  注册
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create footer component**

Create `apps/web/src/components/layout/footer.tsx`:

```typescript
export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500">
            <span className="font-medium text-primary-600">简书</span> © 2026
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-gray-700">关于</a>
            <a href="#" className="hover:text-gray-700">联系我们</a>
            <a href="#" className="hover:text-gray-700">隐私政策</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Create home page layout**

Create `apps/web/src/components/layout/page-layout.tsx`:

```typescript
import { Header } from './header';
import { Footer } from './footer';

interface PageLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

export function PageLayout({ children, showFooter = true }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}
```

- [ ] **Step 4: Update home page**

Modify `apps/web/src/app/page.tsx`:

```typescript
import { PageLayout } from '@/components/layout/page-layout';

export default function Home() {
  return (
    <PageLayout>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">发现</h1>
        <p className="text-gray-500 mb-8">在这里发现有趣的内容</p>
        {/* Article list will be added in Task 5 */}
        <div className="text-gray-400 text-center py-12">
          文章列表将在后续步骤中添加
        </div>
      </div>
    </PageLayout>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/layout/header.tsx apps/web/src/components/layout/footer.tsx apps/web/src/components/layout/page-layout.tsx apps/web/src/app/page.tsx
git commit -m "feat(web): add header, footer and page layout"
```

---

## Task 5: Login & Register Pages

**Files:**
- Create: `apps/web/src/app/(auth)/login/page.tsx`
- Create: `apps/web/src/app/(auth)/register/page.tsx`
- Create: `apps/web/src/components/auth/login-form.tsx`
- Create: `apps/web/src/components/auth/register-form.tsx`

- [ ] **Step 1: Create login form component**

Create `apps/web/src/components/auth/login-form.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">登录</h1>
        <p className="text-sm text-gray-500 mt-1">
          还没有账号？<Link href="/register" className="text-primary-600 hover:underline">立即注册</Link>
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              邮箱
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              密码
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '登录中...' : '登录'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create register form component**

Create `apps/web/src/components/auth/register-form.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    username: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }

    if (formData.password.length < 6) {
      setError('密码至少6个字符');
      return;
    }

    setIsLoading(true);

    try {
      await register(formData.email, formData.password, formData.name, formData.username);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">注册</h1>
        <p className="text-sm text-gray-500 mt-1">
          已有账号？<Link href="/login" className="text-primary-600 hover:underline">立即登录</Link>
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>
          )}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              昵称
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="你的昵称"
              required
            />
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              用户名
            </label>
            <Input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              placeholder="username"
              pattern="[a-zA-Z0-9_]+"
              title="只能包含字母、数字和下划线"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              邮箱
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              密码
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="至少6个字符"
              required
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              确认密码
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="再次输入密码"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '注册中...' : '注册'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create login page**

Create `apps/web/src/app/(auth)/login/page.tsx`:

```typescript
import { PageLayout } from '@/components/layout/page-layout';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <PageLayout showFooter={false}>
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
        <LoginForm />
      </div>
    </PageLayout>
  );
}
```

- [ ] **Step 4: Create register page**

Create `apps/web/src/app/(auth)/register/page.tsx`:

```typescript
import { PageLayout } from '@/components/layout/page-layout';
import { RegisterForm } from '@/components/auth/register-form';

export default function RegisterPage() {
  return (
    <PageLayout showFooter={false}>
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
        <RegisterForm />
      </div>
    </PageLayout>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/\(auth\)/login/page.tsx apps/web/src/app/\(auth\)/register/page.tsx apps/web/src/components/auth/login-form.tsx apps/web/src/components/auth/register-form.tsx
git commit -m "feat(web): add login and register pages"
```

---

## Task 6: Article Components & Home Page

**Files:**
- Create: `apps/web/src/components/article/article-card.tsx`
- Create: `apps/web/src/components/article/article-content.tsx`
- Modify: `apps/web/src/app/page.tsx`

- [ ] **Step 1: Create article card component**

Create `apps/web/src/components/article/article-card.tsx`:

```typescript
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import type { ArticleWithAuthor } from '@/types';

interface ArticleCardProps {
  article: ArticleWithAuthor;
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Link href={`/user/${article.author.username}`} className="flex items-center gap-2">
                <Avatar src={article.author.avatar} alt={article.author.name} size="sm" />
                <span className="text-sm text-gray-600 hover:text-gray-900">
                  {article.author.name}
                </span>
              </Link>
              <span className="text-gray-300">·</span>
              <span className="text-sm text-gray-400">{formatDate(article.createdAt)}</span>
            </div>

            <Link href={`/article/${article.slug}`}>
              <h2 className="text-xl font-semibold text-gray-900 hover:text-primary-600 mb-2 line-clamp-2">
                {article.title}
              </h2>
            </Link>

            {article.excerpt && (
              <p className="text-gray-500 text-sm mb-3 line-clamp-2">{article.excerpt}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {article.likeCount}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                {article.commentCount}
              </span>
            </div>
          </div>

          {article.coverImage && (
            <div className="hidden sm:block w-32 h-24 flex-shrink-0">
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full h-full object-cover rounded-md"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create article content component**

Create `apps/web/src/components/article/article-content.tsx`:

```typescript
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import type { ArticleWithAuthor } from '@/types';

interface ArticleContentProps {
  article: ArticleWithAuthor;
  onLike?: () => void;
  isLiking?: boolean;
}

export function ArticleContent({ article, onLike, isLiking }: ArticleContentProps) {
  return (
    <article className="max-w-3xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{article.title}</h1>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar src={article.author.avatar} alt={article.author.name} size="md" />
            <div>
              <p className="font-medium text-gray-900">{article.author.name}</p>
              <p className="text-sm text-gray-500">
                {formatDate(article.createdAt)} · {article.readCount} 阅读
              </p>
            </div>
          </div>

          <Button
            variant={article.isLiked ? 'primary' : 'secondary'}
            size="sm"
            onClick={onLike}
            disabled={isLiking}
          >
            <svg className="w-4 h-4 mr-1" fill={article.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {article.likeCount}
          </Button>
        </div>

        {article.tags.length > 0 && (
          <div className="flex gap-2 mt-4">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <div
        className="prose-jianshu"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </article>
  );
}
```

- [ ] **Step 3: Create article list component**

Create `apps/web/src/components/article/article-list.tsx`:

```typescript
import { ArticleCard } from './article-card';
import type { ArticleWithAuthor } from '@/types';

interface ArticleListProps {
  articles: ArticleWithAuthor[];
  isLoading?: boolean;
}

export function ArticleList({ articles, isLoading }: ArticleListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-40 bg-gray-100 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">还没有文章</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Update home page with article list**

Modify `apps/web/src/app/page.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/page-layout';
import { ArticleList } from '@/components/article/article-list';
import { articleApi } from '@/lib/api';
import type { ArticleWithAuthor } from '@/types';

export default function Home() {
  const [articles, setArticles] = useState<ArticleWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await articleApi.list({ page: 1, limit: 20 });
        setArticles(res.items);
      } catch (error) {
        console.error('Failed to fetch articles:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchArticles();
  }, []);

  return (
    <PageLayout>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">发现</h1>
        </div>
        <ArticleList articles={articles} isLoading={isLoading} />
      </div>
    </PageLayout>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/article/article-card.tsx apps/web/src/components/article/article-content.tsx apps/web/src/components/article/article-list.tsx apps/web/src/app/page.tsx
git commit -m "feat(web): add article components and home page with article list"
```

---

## Task 7: Article Detail Page

**Files:**
- Create: `apps/web/src/app/article/[slug]/page.tsx`
- Create: `apps/web/src/hooks/use-article.ts`

- [ ] **Step 1: Create use-article hook**

Create `apps/web/src/hooks/use-article.ts`:

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { articleApi } from '@/lib/api';
import type { ArticleWithAuthor } from '@/types';

export function useArticle(slug: string) {
  const [article, setArticle] = useState<ArticleWithAuthor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticle = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await articleApi.getBySlug(slug);
      if (res.success && res.data) {
        setArticle(res.data);
      } else {
        setError('Article not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load article');
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  const likeArticle = useCallback(async () => {
    if (!article) return;
    try {
      const res = await articleApi.like(slug);
      if (res.success && res.data) {
        setArticle((prev) =>
          prev ? { ...prev, likeCount: res.data!.likeCount, isLiked: !prev.isLiked } : null
        );
      }
    } catch (err) {
      console.error('Failed to like article:', err);
    }
  }, [slug, article]);

  return { article, isLoading, error, likeArticle, refetch: fetchArticle };
}
```

- [ ] **Step 2: Create article detail page**

Create `apps/web/src/app/article/[slug]/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { PageLayout } from '@/components/layout/page-layout';
import { ArticleContent } from '@/components/article/article-content';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useArticle } from '@/hooks/use-article';

export default function ArticlePage() {
  const params = useParams();
  const slug = params.slug as string;
  const { article, isLoading, error, likeArticle } = useArticle(slug);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    setIsLiking(true);
    try {
      await likeArticle();
    } finally {
      setIsLiking(false);
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-3/4" />
            <div className="h-6 bg-gray-200 rounded w-1/4" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !article) {
    return (
      <PageLayout>
        <div className="max-w-3xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">文章不存在</h1>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => window.history.back()}>返回</Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="bg-gray-50 py-8">
        <ArticleContent article={article} onLike={handleLike} isLiking={isLiking} />
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">评论</h3>
            <p className="text-gray-500 text-sm">评论功能开发中...</p>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/article/\[slug\]/page.tsx apps/web/src/hooks/use-article.ts
git commit -m "feat(web): add article detail page"
```

---

## Task 8: Write/Edit Article Page

**Files:**
- Create: `apps/web/src/components/article/article-editor.tsx`
- Create: `apps/web/src/app/(app)/write/page.tsx`
- Create: `apps/web/src/app/(app)/layout.tsx`
- Create: `apps/web/src/app/(app)/settings/page.tsx`

- [ ] **Step 1: Create article editor component**

Create `apps/web/src/components/article/article-editor.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { articleApi } from '@/lib/api';
import type { CreateArticleRequest } from '@jianshu/shared';

interface ArticleEditorProps {
  initialData?: Partial<CreateArticleRequest>;
  slug?: string;
  isEditing?: boolean;
}

export function ArticleEditor({ initialData, slug, isEditing }: ArticleEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [tags, setTags] = useState((initialData?.tags || []).join(', '));
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent, publish: boolean = true) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const articleData: CreateArticleRequest = {
      title,
      content,
      excerpt: excerpt || undefined,
      coverImage: coverImage || undefined,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
    };

    try {
      let result;
      if (isEditing && slug) {
        result = await articleApi.update(slug, articleData);
      } else {
        result = await articleApi.create(articleData);
      }

      if (result.success && result.data) {
        router.push(`/article/${result.data.slug}`);
      } else {
        setError(result.error || 'Failed to save article');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save article');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    await handleSubmit(e, false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
      <Card>
        <CardContent className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>
          )}

          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入文章标题..."
            className="text-2xl font-bold border-none px-0 focus:ring-0 placeholder:text-gray-300"
            required
          />

          <div className="flex gap-4">
            <input
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="封面图片 URL（可选）"
              className="flex-1 h-10 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-primary-500"
            />
          </div>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="输入文章内容...（支持 Markdown）"
            className="min-h-[400px] font-serif text-lg leading-relaxed"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">摘要（可选）</label>
            <Textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="文章摘要..."
              className="min-h-[80px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">标签（用逗号分隔）</label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="技术, 随笔, 读书..."
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            取消
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={handleSaveDraft} disabled={isSubmitting}>
              保存草稿
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '发布中...' : '发布'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  );
}
```

- [ ] **Step 2: Create authenticated layout**

Create `apps/web/src/app/(app)/layout.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { PageLayout } from '@/components/layout/page-layout';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-500">加载中...</p>
        </div>
      </PageLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <PageLayout>{children}</PageLayout>;
}
```

- [ ] **Step 3: Create write page**

Create `apps/web/src/app/(app)/write/page.tsx`:

```typescript
import { ArticleEditor } from '@/components/article/article-editor';

export default function WritePage() {
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <ArticleEditor />
    </div>
  );
}
```

- [ ] **Step 4: Create settings page**

Create `apps/web/src/app/(app)/settings/page.tsx`:

```typescript
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">设置</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">基本信息</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar src={user?.avatar} alt={user?.name || ''} size="lg" />
              <Button variant="secondary" size="sm">更换头像</Button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
              <Input defaultValue={user?.name} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
              <Input defaultValue={user?.username} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
              <Input defaultValue={user?.email} disabled />
            </div>
            <Button>保存修改</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">修改密码</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">当前密码</label>
              <Input type="password" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
              <Input type="password" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
              <Input type="password" />
            </div>
            <Button>修改密码</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/article/article-editor.tsx apps/web/src/app/\(app\)/layout.tsx apps/web/src/app/\(app\)/write/page.tsx apps/web/src/app/\(app\)/settings/page.tsx
git commit -m "feat(web): add write/edit article page and settings page"
```

---

## Task 9: User Profile Page

**Files:**
- Create: `apps/web/src/app/user/[username]/page.tsx`
- Create: `apps/web/src/components/user/profile-header.tsx`

- [ ] **Step 1: Create profile header component**

Create `apps/web/src/components/user/profile-header.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { userApi } from '@/lib/api';
import type { User } from '@jianshu/shared';

interface ProfileHeaderProps {
  user: User;
  isOwnProfile?: boolean;
  initialIsFollowing?: boolean;
}

export function ProfileHeader({ user, isOwnProfile, initialIsFollowing }: ProfileHeaderProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);

  const handleFollow = async () => {
    setIsFollowingLoading(true);
    try {
      const res = await userApi.follow(user.id);
      if (res.success && res.data) {
        setIsFollowing(res.data.isFollowing);
      }
    } catch (error) {
      console.error('Failed to follow/unfollow:', error);
    } finally {
      setIsFollowingLoading(false);
    }
  };

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-start gap-6">
          <Avatar src={user.avatar} alt={user.name} size="lg" className="w-20 h-20 text-lg" />

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              {user.bio && <span className="text-gray-500">·</span>}
              {user.bio && <p className="text-gray-500">{user.bio}</p>}
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
              <span>
                <strong className="text-gray-900">{user.followerCount || 0}</strong> 粉丝
              </span>
              <span>
                <strong className="text-gray-900">{user.followingCount || 0}</strong> 关注
              </span>
              <span>
                <strong className="text-gray-900">{user.articleCount || 0}</strong> 文章
              </span>
            </div>

            {!isOwnProfile && (
              <Button
                variant={isFollowing ? 'secondary' : 'primary'}
                size="sm"
                onClick={handleFollow}
                disabled={isFollowingLoading}
              >
                {isFollowing ? '已关注' : '关注'}
              </Button>
            )}

            {isOwnProfile && (
              <Button variant="secondary" size="sm">编辑个人资料</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create user profile page**

Create `apps/web/src/app/user/[username]/page.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PageLayout } from '@/components/layout/page-layout';
import { ProfileHeader } from '@/components/user/profile-header';
import { ArticleList } from '@/components/article/article-list';
import { useAuth } from '@/hooks/use-auth';
import { userApi } from '@/lib/api';
import type { ArticleWithAuthor, User } from '@/types';

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<User | null>(null);
  const [articles, setArticles] = useState<ArticleWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [profileRes, articlesRes] = await Promise.all([
          userApi.getByUsername(username),
          userApi.getArticles(username, { page: 1, limit: 20 }),
        ]);

        if (profileRes.success && profileRes.data) {
          setProfile(profileRes.data);
        } else {
          setError('User not found');
        }

        if (articlesRes) {
          setArticles(articlesRes.items);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [username]);

  if (isLoading) {
    return (
      <PageLayout>
        <div className="animate-pulse">
          <div className="h-40 bg-gray-100" />
        </div>
      </PageLayout>
    );
  }

  if (error || !profile) {
    return (
      <PageLayout>
        <div className="max-w-5xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">用户不存在</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </PageLayout>
    );
  }

  const isOwnProfile = currentUser?.username === profile.username;

  return (
    <PageLayout>
      <ProfileHeader user={profile} isOwnProfile={isOwnProfile} />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <main className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">文章</h2>
            <ArticleList articles={articles} />
          </main>

          <aside className="hidden md:block w-64">
            <div className="sticky top-20">
              <h3 className="font-semibold text-gray-900 mb-4">个人介绍</h3>
              <p className="text-gray-500 text-sm">
                {profile.bio || '暂无个人介绍'}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </PageLayout>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/user/\[username\]/page.tsx apps/web/src/components/user/profile-header.tsx
git commit -m "feat(web): add user profile page"
```

---

## Task 10: Environment Setup & Final Build

**Files:**
- Create: `apps/web/.env.local`
- Modify: `apps/web/next.config.js`

- [ ] **Step 1: Create environment file**

Create `apps/web/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
```

- [ ] **Step 2: Update next config for API proxy (optional, for production)**

Modify `apps/web/next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@jianshu/shared'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
```

- [ ] **Step 3: Run full build verification**

```bash
cd apps/web
pnpm build
```

Expected: Successful build with no errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/.env.local apps/web/next.config.js
git commit -m "chore(web): add environment configuration"
```

---

## Verification

1. **Run frontend:**
   ```bash
   pnpm dev
   ```

2. **Verify pages:**
   - Home page at http://localhost:3000
   - Login at http://localhost:3000/login
   - Register at http://localhost:3000/register
   - Write article at http://localhost:3000/write (requires login)
   - Article detail at http://localhost:3000/article/{slug}
   - User profile at http://localhost:3000/user/{username}

3. **Test user flow:**
   - Register a new user
   - Login with the user
   - Create a new article
   - View the article
   - Visit user profile

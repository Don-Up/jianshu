## V2-FTask5 代码实现/修改流程

---

### Step 1: 创建 useSearch Hook

**文件**: `apps/web/src/hooks/use-search.ts` (新建)

这个 Hook 管理搜索状态，参考了 `useComments` 的分页模式。

```typescript
'use client';

import { useState, useCallback, useEffect } from 'react';
import { articleApi } from '@/lib/api';
import type { ArticleWithAuthor } from '@/types';

// --- Hook 返回值类型定义 ---
interface UseSearchResult {
  articles: ArticleWithAuthor[];  // 搜索结果列表
  isLoading: boolean;            // 是否正在加载
  error: string | null;           // 错误信息
  hasMore: boolean;               // 是否还有更多页
  loadMore: () => Promise<void>; // 加载下一页
}

// query: 搜索关键词，由父组件从 URL ?q= 参数传入
export function useSearch(query: string): UseSearchResult {
  // articles: 搜索结果列表，初始化为空数组
  const [articles, setArticles] = useState<ArticleWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // hasMore: 是否还有更多页，初始 false
  const [hasMore, setHasMore] = useState(false);
  // page: 当前页码，初始 1
  const [page, setPage] = useState(1);
  // totalPages: 总页数，用于判断 hasMore
  const [totalPages, setTotalPages] = useState(1);
```

> **设计说明**: Hook 不自己在 mount 时调用 `loadResults`，而是通过 `useEffect` 监听 `query` 变化来触发搜索。这样父组件控制查询时机，Hook 只负责状态管理和数据获取。

```typescript
  // --- 核心搜索方法 ---
  // loadResults: 实际调用 API 获取搜索结果
  // searchQuery: 搜索关键词，pageNum: 页码（默认1）
  const loadResults = useCallback(async (searchQuery: string, pageNum: number = 1) => {
    // 空关键词或纯空白时，清空列表并返回
    if (!searchQuery?.trim()) {
      setArticles([]);
      return;
    }

    setIsLoading(true);   // 开始加载
    setError(null);        // 清空上次错误

    try {
      // articleApi.list 本身支持 search 参数，无需新建 API 方法
      // limit: 20，每页加载 20 条
      const res = await articleApi.list({ search: searchQuery, page: pageNum, limit: 20 });

      if (res.success && res.data) {
        // ---------- 分页逻辑：replace vs append ----------
        // pageNum === 1：全新搜索，用新结果替换旧列表
        // pageNum > 1：加载更多，追加到现有列表末尾
        if (pageNum === 1) {
          setArticles(res.data.items);
        } else {
          setArticles((prev) => [...prev, ...res.data!.items]);
        }

        // 更新分页状态
        setTotalPages(res.data.totalPages);
        setHasMore(pageNum < res.data.totalPages);  // 当前页 < 总页数 → 有更多
        setPage(pageNum);
      } else {
        // API 返回 success: false
        setError(res.error || 'Search failed');
      }
    } catch (err) {
      // 网络错误或 JSON 解析失败
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);  // 无论成功失败，都要关闭 loading
    }
  }, []);  // 依赖为空：loadResults 引用稳定
```

> **关键点**: `loadResults` 是 `useCallback` 包装的稳定引用，放入 `useEffect` 依赖数组时不会导致无限循环。

```typescript
  // --- useEffect：监听 query 变化触发搜索 ---
  // 每次 query 变化时（用户提交新搜索），重新从第 1 页加载
  // query 是字符串，loadResults 是稳定引用
  useEffect(() => {
    if (query?.trim()) {
      loadResults(query, 1);  // query 变化 → 全新搜索（第 1 页）
    } else {
      setArticles([]);         // query 为空 → 清空列表
    }
  }, [query, loadResults]);  // query 或 loadResults 变化时重新执行
```

> **为什么 query 变化要用 useEffect 而不是直接在 Hook 里调用**: 因为 `useEffect` 在组件渲染后异步执行，不会阻塞 UI。而同步调用会导致在数据到达前 UI 处于不一致状态。

```typescript
  // --- loadMore: 加载下一页 ---
  // 依赖闭包中的 hasMore、page、totalPages、query
  const loadMore = useCallback(async () => {
    // 三个条件任一满足则不加载：没有更多 / 正在加载 / 已到最后一页
    if (!hasMore || isLoading || page >= totalPages) return;
    // 调用 loadResults，page + 1
    await loadResults(query, page + 1);
  }, [hasMore, isLoading, page, totalPages, query, loadResults]);

  return { articles, isLoading, error, hasMore, loadMore };
}
```

---

### Step 2: 创建 SearchBar 组件

**文件**: `apps/web/src/components/layout/search-bar.tsx` (新建)

搜索框组件，放在 Header 中。用户提供关键词后按 Enter 或点击搜索图标跳转到 `/search` 页面。

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function SearchBar() {
  // query: 输入框的当前值（受控组件）
  const [query, setQuery] = useState('');
  const router = useRouter();

  // --- 表单提交处理 ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();  // 阻止表单默认提交（页面刷新）
    if (query.trim()) {
      // 跳转到搜索结果页，query 参数使用 encodeURIComponent 编码
      // 例：关键词 "测试" → /search?q=%E6%B5%8B%E8%AF%95
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  // --- Enter 键处理 ---
  // Input 的 onKeyDown 监听 Enter 键，手动触发提交
  // 这样用户可以直接按 Enter，不需要先点击搜索图标
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };
```

> **设计说明**: 使用 `form onSubmit` 而非直接 `onChange` + 立即搜索，原因有三：
> 1. **URL 可分享** — 提交后才跳转，URL 包含完整搜索词，可以复制分享
> 2. **防止无意义请求** — 不需要每次按键都请求，输入过程中无 API 调用
> 3. **明确的用户意图** — 用户按 Enter 表示"我要搜索"，而非"我在打字"

```typescript
  return (
    // form: 语义化的表单，Enter 键可触发提交
    <form onSubmit={handleSubmit} className="relative flex items-center">
      {/* Input: type="search" 在部分浏览器会显示清除按钮 */}
      <Input
        type="search"
        placeholder="搜索文章..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        // w-48: 搜索框宽度，pr-10: 为右侧图标按钮留出 padding
        className="w-48 pr-10"
      />
      {/* Button: absolute 定位在 Input 内部右侧，不会撑开宽度 */}
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="absolute right-0 h-full px-3 hover:bg-transparent"
      >
        {/* SVG 搜索图标 */}
        <svg
          className="w-4 h-4 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </Button>
    </form>
  );
}
```

---

### Step 3: 创建搜索结果页面

**文件**: `apps/web/src/app/search/page.tsx` (新建)

搜索结果页面，通过 `useSearchParams()` 读取 URL 中的 `?q=` 参数。

```typescript
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';  // App Router 读取 URL 参数
import { PageLayout } from '@/components/layout/page-layout';
import { ArticleList } from '@/components/article/article-list';
import { Button } from '@/components/ui/button';
import { useSearch } from '@/hooks/use-search';

// --- SearchContent: 实际渲染搜索结果的子组件 ---
// 为什么要拆成子组件？因为 useSearchParams() 必须在 Suspense 边界内使用
function SearchContent() {
  // useSearchParams() 返回 URLSearchParams 对象
  // get('q') 拿到 URL 中 ?q= 的值，如 /search?q=测试 → "测试"
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';  // 空字符串表示没有参数

  // useSearch(query) 内部会在 query 变化时自动调用 API
  const { articles, isLoading, error, hasMore, loadMore } = useSearch(query);
```

> **为什么需要 Suspense**: `useSearchParams()` 在 Next.js App Router 中是潜在的客户端渲染边界，需要用 `<Suspense>` 包裹以支持流式渲染和部分预渲染。`SearchFallback` 是加载中的骨架屏。

```typescript
  // --- 空关键词处理 ---
  if (!query) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">请输入搜索关键词</p>
      </div>
    );
  }

  // --- 错误状态 ---
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">搜索失败: {error}</p>
      </div>
    );
  }

  // --- 无结果状态 ---
  // 只有在非加载中（isLoading=false）且 articles 为空时才显示"无结果"
  // 加载中时显示骨架屏，不显示无结果提示
  if (!isLoading && articles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">没有找到相关文章</p>
      </div>
    );
  }

  // --- 正常结果渲染 ---
  return (
    <div className="space-y-4">
      {/* ArticleList 复用首页的文章列表组件 */}
      <ArticleList articles={articles} isLoading={isLoading} />

      {/* "加载更多" 按钮：hasMore 为 true 时显示 */}
      {hasMore && (
        <div className="py-4 text-center">
          <Button variant="outline" onClick={loadMore} disabled={isLoading}>
            {isLoading ? '加载中...' : '加载更多'}
          </Button>
        </div>
      )}
    </div>
  );
}
```

> **关键点**: `ArticleList` 组件复用 — 搜索结果和首页文章列表使用同一个组件，不需要新建 `SearchResultsList`。`ArticleList` 内部已有空状态（"还没有文章"）和加载骨架屏的逻辑。

```typescript
// --- SearchFallback: Suspense 的 fallback（加载骨架屏）---
// 在 SearchContent 加载时（ssr 或数据未返回）显示骨架屏
function SearchFallback() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse">
          {/* h-40: 与 ArticleCard 高度接近 */}
          <div className="h-40 bg-muted rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// --- 页面入口 ---
export default function SearchPage() {
  return (
    <PageLayout>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">搜索结果</h1>
        </div>
        {/* Suspense 边界：useSearchParams 需要包裹在 Suspense 内 */}
        <Suspense fallback={<SearchFallback />}>
          <SearchContent />
        </Suspense>
      </div>
    </PageLayout>
  );
}
```

---

### Step 4: 修改 Header 添加搜索框

**文件**: `apps/web/src/components/layout/header.tsx` (修改)

在 Header 右侧（认证控件左侧）添加 `<SearchBar />`。

```diff
  import Link from 'next/link';
  import { useRouter } from 'next/navigation';
  import { useAuth } from '@/hooks/use-auth';
  import { Button } from '@/components/ui/button';
  import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
+ import { SearchBar } from './search-bar';
```

```diff
        <div className="flex items-center gap-4">
+         <SearchBar />
          {isAuthenticated ? (
```

> **放置位置**: `<SearchBar />` 在认证控件左侧，nav 链接右侧。这是因为搜索框是全局功能，应该在视觉上居中或靠右，与 Logo/导航 保持一定距离。放在认证控件前面确保登录/未登录用户都能看到。

---

### 完整文件树

```
apps/web/src/
├── app/
│   └── search/
│       └── page.tsx                  # 新建：搜索结果页
├── components/layout/
│   ├── header.tsx                     # 修改：添加 SearchBar
│   └── search-bar.tsx                # 新建：搜索框组件
├── hooks/
│   └── use-search.ts                  # 新建：搜索状态 Hook
└── lib/
    └── api.ts                        # 引用（未修改，articleApi.list 已支持 search）

packages/shared/src/index.ts           # 引用（未修改，ArticleListParams.search 已存在）
```

---

### 改动汇总

| 文件 | 操作 | 说明 |
|------|------|------|
| `apps/web/src/hooks/use-search.ts` | 新建 | 搜索状态管理，包含分页 replace/append 逻辑 |
| `apps/web/src/components/layout/search-bar.tsx` | 新建 | 搜索输入框 + 提交表单 |
| `apps/web/src/app/search/page.tsx` | 新建 | 搜索结果页，读取 `?q=` 参数 |
| `apps/web/src/components/layout/header.tsx` | 修改 | 引入并渲染 `<SearchBar />` |

---

### 数据流

```
用户输入关键词
       ↓
SearchBar 输入框 onChange → 更新本地 state
       ↓
用户按 Enter / 点击搜索图标
       ↓
router.push(/search?q=xxx) → URL 变化
       ↓
SearchPage 挂载 → useSearchParams() 读取 ?q=
       ↓
useSearch(query) → articleApi.list({ search: query })
       ↓
API 返回 → setArticles → ArticleList 渲染
```

---

### 与现有组件的关系

| 组件 | 复用方式 |
|------|---------|
| `ArticleList` | 直接复用 — 显示搜索结果列表，空状态和骨架屏都由它处理 |
| `ArticleCard` | 通过 ArticleList 间接复用 — ArticleList 内部渲染 ArticleCard |
| `articleApi.list` | 直接使用 — `articleApi.list({ search: query })` 已是完整的搜索 API 调用 |
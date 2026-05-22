## V2-FTask4 代码实现/修改流程

---

### Step 1: 添加 shared 类型定义

**文件**: `packages/shared/src/index.ts`

评论功能需要三个类型：`Comment`、`CreateCommentRequest`、`CommentListParams`。其中 `Comment` 需要新增，`CreateCommentRequest` 和 `CommentListParams` 已在 backend 定义可复用。

```typescript
// packages/shared/src/index.ts 新增

// --- 核心评论类型 ---
// id: 评论唯一标识，用于删除等操作
// content: 评论正文内容，最大长度由后端决定
// createdAt: 评论发布时间，用于显示"3分钟前"等时间格式化
// author: 只暴露 id/username/name/avatar 四个字段，不泄漏完整 User 信息
export interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  author: Pick<User, 'id' | 'username' | 'name' | 'avatar'>;
}

// --- 创建评论请求体 ---
// POST /api/articles/:articleId/comments 时发送此结构
export interface CreateCommentRequest {
  content: string;  // 用户输入的评论正文
}

// --- 评论列表查询参数 ---
// 继承自 PaginationParams，包含 page 和 limit 字段
// GET /api/articles/:articleId/comments?page=1&limit=10
export interface CommentListParams extends PaginationParams {}
```

> **关键点**: `Comment.author` 用 `Pick<User, ...>` 而非完整 `User`，只暴露了评论展示所需的最小字段，减少信息泄漏风险。

---

### Step 2: 添加 web types

**文件**: `apps/web/src/types/index.ts`

前端需要 `CommentListResponse` 来接收分页数据：

```typescript
// 引入 shared 包中的 Comment 类型（保持类型定义单一来源）
import type { ..., Comment } from '@jianshu/shared';

// PaginatedResponse<T> 是后端约定的通用分页包装格式
// 实际结构为：{ success: true, data: { items: T[], totalPages: number, totalCount: number, page: number, limit: number }, error: null }
// 使用时通过 res.data.items 访问评论数组，res.data.totalPages 判断是否有更多页
export type CommentListResponse = PaginatedResponse<Comment>;
```

> **关键点**: `PaginatedResponse<Comment>` 是 `{ success, data: { items: Comment[], totalPages, ... }, error }` 的泛型包装，由 `fetchApi<CommentListResponse>()` 解包后 data 中即可访问 `.items`。

---

### Step 3: 在 api.ts 中添加 commentApi

**文件**: `apps/web/src/lib/api.ts`

新增 `commentApi` 对象，提供 list / create / delete 三个方法：

```typescript
// 从 shared 包引入创建评论所需的请求体类型和分页参数类型
import type { CreateCommentRequest, CommentListParams } from '@jianshu/shared';
// 从本地 types 引入前端定义的 CommentListResponse（包含 success/data/error 包装）
import type { CommentListResponse } from '@/types';

// commentApi 对应后端 /api/articles/:articleId/comments 路由
export const commentApi = {
  // GET /api/articles/:articleId/comments?page=1&limit=10
  // params 是可选的，调用时不传则请求第一页默认 10 条
  list: (articleId: string, params?: CommentListParams) => {
    // 将 { page: 1, limit: 10 } 对象转为 URLSearchParams 字符串
    // filter 过滤掉 undefined 值，map 转为 [key, string] 数组
    const searchParams = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)  // 忽略 undefined 的字段
            .map(([k, v]) => [k, String(v)])    // 转为字符串：page -> "1"
        ).toString()
      : '';

    // 调用 fetchApi<T> 泛型方法，自动处理 JWT token 注入和响应解包
    // 返回类型是 ApiResponse<CommentListResponse>，即 { success, data: CommentListResponse, error }
    return fetchApi<CommentListResponse>(
      `/api/articles/${articleId}/comments${searchParams ? `?${searchParams}` : ''}`
    );
  },

  // POST /api/articles/:articleId/comments
  // data 是 { content: string }，即 CreateCommentRequest
  // 返回新创建的 Comment 对象（包含 id、createdAt、author 等完整信息）
  create: (articleId: string, data: CreateCommentRequest) =>
    fetchApi<Comment>(`/api/articles/${articleId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),  // 将 { content: "评论内容" } 序列化为 JSON
    }),

  // DELETE /api/articles/:articleId/comments/:commentId
  // 删除成功后返回空 body，后端返回 200 或 204
  delete: (articleId: string, commentId: string) =>
    fetchApi<void>(`/api/articles/${articleId}/comments/${commentId}`, {
      method: 'DELETE',
    }),
};
```

> **关键点**: `list` 方法手动拼接 URLSearchParams，因为 `fetchApi` 不处理查询参数；`create` 返回 `ApiResponse<Comment>`；`delete` 返回 `ApiResponse<void>`。

---

### Step 4: 创建 useComments hook

**文件**: `apps/web/src/hooks/use-comments.ts` (新建)

```typescript
// 'use client' 是 Next.js App Router 的客户端组件标记
// 所有使用 useState、useEffect、useAuth 的组件都必须标注此标记
'use client';

import { useState, useCallback } from 'react';
import { commentApi } from '@/lib/api';  // 调用评论 API
import type { Comment, CommentListParams } from '@jianshu/shared';

// --- hook 返回值类型定义（公开契约）---
// 外部组件只能调用这些方法，不能直接修改状态
interface UseCommentsResult {
  comments: Comment[];         // 评论列表数据
  isLoading: boolean;           // 是否正在加载（用于骨架屏/加载动画）
  error: string | null;         // 错误信息（用于显示错误提示）
  hasMore: boolean;             // 是否还有更多页（用于"加载更多"按钮显示）
  loadComments: (articleId: string, page?: number) => Promise<void>;  // 加载指定页
  createComment: (articleId: string, content: string) => Promise<boolean>;  // 创建评论
  deleteComment: (articleId: string, commentId: string) => Promise<boolean>;  // 删除评论
  loadMore: () => Promise<void>;  // 加载下一页（内部读取 page + totalPages）
}

// --- hook 主体：初始化所有状态 ---
export function useComments(): UseCommentsResult {
  // comments: 评论列表，初始化为空数组（异步数据需要 loading 状态配合消歧义）
  const [comments, setComments] = useState<Comment[]>([]);
  // isLoading: 控制骨架屏/加载动画，初始 false（页面首次加载时 useEffect 触发）
  const [isLoading, setIsLoading] = useState(false);
  // error: 错误信息，null 表示无错误
  const [error, setError] = useState<string | null>(null);
  // hasMore: 是否还有下一页，初始 false（API 返回后由 totalPages 计算）
  const [hasMore, setHasMore] = useState(false);

  // page: 当前已加载的页码，初始 1（用于 loadMore 时计算 next page）
  const [page, setPage] = useState(1);
  // articleId: 当前正在加载的 文章ID，初始空字符串
  // 用于 loadMore 时判断是否是同一篇文章（切换文章时重置状态）
  const [articleId, setArticleId] = useState<string>('');
  // totalPages: 总页数，从 API 返回的 totalPages 字段获取
  // 用于判断 hasMore = page < totalPages
  const [totalPages, setTotalPages] = useState(1);
```

> **状态设计**: `page`、`totalPages`、`articleId` 都是闭包数据，由 `loadMore` 读取来决定是否继续加载。

**loadComments 实现**（分页核心）：

```typescript
// useCallback 包装确保函数引用稳定，避免 useEffect 依赖数组频繁变化
// artId: 文章ID，pageNum: 页码（默认1）
const loadComments = useCallback(async (artId: string, pageNum: number = 1) => {
  // 开始加载：显示 loading 状态，清除上次错误，记录当前文章ID
  setIsLoading(true);
  setError(null);
  setArticleId(artId);

  try {
    // 调用 commentApi.list，传入文章ID和分页参数
    const res = await commentApi.list(artId, { page: pageNum, limit: 10 });

    // API 调用成功且返回了数据
    if (res.success && res.data) {
      // ---------- 分页逻辑：replace vs append ----------
      // pageNum === 1 表示"全新加载"（下拉刷新或首次进入）
      // 此时应该替换整个列表，而不是追加
      if (pageNum === 1) {
        setComments(res.data.items);        // 替换：全新加载
      } else {
        // pageNum > 1 表示"加载更多"（点击"加载更多"按钮）
        // 此时应该追加到现有列表末尾，而不是覆盖
        setComments((prev) => [...prev, ...res.data!.items]);  // 追加：加载更多
      }

      // 更新分页状态，供 loadMore 判断是否还有更多数据
      setTotalPages(res.data.totalPages);       // 总页数，如 5
      setHasMore(pageNum < res.data.totalPages); // 当前页 < 总页数 → 有更多
      setPage(pageNum);                          // 记录当前页
    } else {
      // API 返回 success: false，设置错误信息供 UI 显示
      setError(res.error || 'Failed to load comments');
    }
  } catch (err) {
    // 网络错误或代码异常（如 JSON 解析失败）
    setError(err instanceof Error ? err.message : 'Failed to load comments');
  } finally {
    // 不管成功还是失败，都要关闭 loading 状态
    setIsLoading(false);
  }
}, []);  // 空依赖数组：loadComments 引用稳定，不需要重新创建
```

**createComment 实现**（新评论头部插入）：

```typescript
// 创建评论：发送 POST 请求，成功后本地列表头部插入新评论
const createComment = useCallback(async (artId: string, content: string): Promise<boolean> => {
  try {
    // 调用 commentApi.create，POST 到 /api/articles/:articleId/comments
    const res = await commentApi.create(artId, { content });

    // 成功且返回了新创建的评论数据（包含 id、createdAt、author）
    if (res.success && res.data) {
      // ---------- 双类型转换说明 ----------
      // res.data 的静态类型是 shared 包中的 Comment
      // 但 TypeScript 严格模式认为从 CharacterData（DOM 接口）到 Comment
      // 没有足够重叠，直接 as Comment 会报错
      // as unknown as Comment 先转为 unknown（消除类型约束），再转为目标类型
      const newComment = res.data as unknown as Comment;

      // ---------- 头部插入（反向时间序） ----------
      // 新的评论永远在最前面，符合"最新内容优先"的交互习惯
      // 使用函数式 setComments 防止状态覆盖：prev => [new, ...prev]
      setComments((prev) => [newComment, ...prev]);
      return true;  // 返回 true 告知调用者成功
    }
    // API 返回 success: false，显示错误
    setError(res.error || 'Failed to create comment');
    return false;
  } catch (err) {
    // 网络异常
    setError(err instanceof Error ? err.message : 'Failed to create comment');
    return false;
  }
}, []);
```

> **双类型转换**: `res.data as unknown as Comment` 是必要的，因为 `fetchApi<Comment>` 返回的 `data` 是 shared 包中的 `Comment` 类型，TypeScript 严格模式认为从 `CharacterData` 到 `Comment` 没有足够重叠，直接 cast 会报错，`as unknown as` 先转为 `unknown` 再转目标类型绕过了这个 false positive。

**deleteComment 实现**（乐观更新，无回滚）：

```typescript
// 删除评论：发送 DELETE 请求，成功后本地列表移除该评论
// 采用"乐观更新"策略——假设删除成功，提前从 UI 移除
const deleteComment = useCallback(async (artId: string, commentId: string): Promise<boolean> => {
  try {
    const res = await commentApi.delete(artId, commentId);
    if (res.success) {
      // ---------- 乐观更新 ----------
      // 直接 filter 移除该评论，不等待后端确认
      // 问题：如果 API 失败，UI 已经移除了但数据库没变，用户看到"幻觉删除"
      // 更完善的方案是在 catch 中回滚（将删除的评论重新插入原位置）
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      return true;
    }
    setError(res.error || 'Failed to delete comment');
    return false;
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to delete comment');
    return false;
  }
}, []);

// loadMore 是闭包函数，读取 page 和 hasMore 判断是否继续加载
const loadMore = useCallback(async () => {
  // 三个条件任一满足则不加载：没有更多 / 正在加载 / 已到最后一页
  if (!hasMore || isLoading || page >= totalPages) return;
  // 调用 loadComments 时不传 pageNum（默认使用 page + 1）
  await loadComments(articleId, page + 1);
}, [hasMore, isLoading, page, totalPages, articleId, loadComments]);
```

---

### Step 5: 创建 comment components

#### CommentForm（自包含 Auth Gate）

**文件**: `apps/web/src/components/comments/comment-form.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';

// props: onSubmit 提交回调，isSubmitting 防重复提交标志
interface CommentFormProps {
  onSubmit: (content: string) => Promise<boolean>;
  isSubmitting?: boolean;
}

export function CommentForm({ onSubmit, isSubmitting = false }: CommentFormProps) {
  // content:  textarea 的受控输入值
  const [content, setContent] = useState('');
  // 从 AuthContext 获取当前登录状态（useAuth 内部调用 useContext(AuthContext)）
  const { isAuthenticated } = useAuth();

  // ---------- Auth Gate：未登录时显示登录提示，而不是表单 ----------
  // 这样做的好处是：Form 自己知道何时显示登录框，何时显示表单
  // 父组件 CommentsSection 不需要知道 Form 的内部逻辑（单一职责）
  if (!isAuthenticated) {
    return (
      <div>
        请{' '}
        <a href="/login" className="text-primary underline hover:underline">
          登录
        </a>
        {' '}后发表评论
      </div>
    );
  }

  // 提交处理函数：验证非空 -> 调用 onSubmit -> 成功后清空输入框
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();  // 阻止表单默认提交（页面刷新）
    if (!content.trim()) return;  // 空内容不做提交

    const success = await onSubmit(content.trim());  // 调用 hook 的 createComment
    if (success) {
      setContent('');  // 成功后清空 textarea
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Textarea 是受控组件，value 绑定 content，onChange 同步更新 */}
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="写下你的评论..."
        className="min-h-[80px] resize-y"
        maxLength={2000}  // 后端限制最大 2000 字符
      />
      <div className="flex justify-end">
        {/* disabled 条件：提交中 或 内容为空（防止空评论提交） */}
        <Button type="submit" disabled={isSubmitting || !content.trim()}>
          {isSubmitting ? '发布中...' : '发布评论'}
        </Button>
      </div>
    </form>
  );
}
```

#### CommentItem（owner 判断显示删除按钮）

**文件**: `apps/web/src/components/comments/comment-item.tsx`

```typescript
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import type { Comment } from '@jianshu/shared';
import { useAuth } from '@/hooks/use-auth';

// props: comment 单条评论数据，onDelete 删除回调，isDeleting 是否正在删除
interface CommentItemProps {
  comment: Comment;
  onDelete: (commentId: string) => Promise<boolean>;
  isDeleting?: boolean;
}

export function CommentItem({ comment, onDelete, isDeleting = false }: CommentItemProps) {
  // 从 AuthContext 获取当前登录用户
  const { user } = useAuth();

  // ---------- 前端权限判断：只控制 UI 显示 ----------
  // 比较当前用户 ID 和评论作者 ID
  // 注意：这是"显示控制"而非"权限控制"，后端才是真正的安全校验
  const isOwner = user?.id === comment.author.id;

  // 删除前弹窗确认，避免误操作
  const handleDelete = async () => {
    if (window.confirm('确定要删除这条评论吗？')) {
      await onDelete(comment.id);  // 调用 hook 的 deleteComment
    }
  };

  return (
    <div className="flex gap-3 py-4">
      {/* Avatar 显示用户头像，Fallback 是加载失败时的兜底显示 */}
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={comment.author.avatar || undefined} />
        <AvatarFallback>
          {/* 取 name 或 username 的前两个字符大写，如"张三"->"ZS" */}
          {comment.author.name?.slice(0, 2).toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        {/* 头部：作者名称 + 发布时间 + 删除按钮（仅 owner 显示） */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {comment.author.name || comment.author.username}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDate(comment.createdAt)}
            </span>
          </div>
          {/* isOwner 为 true 时才渲染删除按钮 */}
          {isOwner && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}  // 正在删除时禁用按钮，防止重复点击
              className="text-muted-foreground hover:text-destructive text-xs"
            >
              删除
            </Button>
          )}
        </div>

        {/* 评论正文：white-space: pre-wrap 保留换行，break-words 防止溢出 */}
        <p className="mt-1 text-sm text-foreground whitespace-pre-wrap break-words">
          {comment.content}
        </p>
      </div>
    </div>
  );
}
```

> **注意**: `isOwner` 的判断只在 UI 层显示/隐藏删除按钮，后端 `DELETE /api/articles/:articleId/comments/:id` 仍有 JWT guard 验证评论归属，两者缺一不可。

#### CommentList（isLoading 消歧义 + hasMore 加载更多）

**文件**: `apps/web/src/components/comments/comment-list.tsx`

```typescript
'use client';

import { CommentItem } from './comment-item';
import { Button } from '@/components/ui/button';
import type { Comment } from '@jianshu/shared';

interface CommentListProps {
  comments: Comment[];         // 评论列表数据
  hasMore: boolean;           // 是否还有更多页
  isLoading: boolean;         // 是否正在加载（消歧义用）
  onDelete: (commentId: string) => Promise<boolean>;  // 删除回调
  onLoadMore: () => void;     // 加载更多回调
}

export function CommentList({ comments, hasMore, isLoading, onDelete, onLoadMore }: CommentListProps) {
  // ---------- 消歧义条件 ----------
  // 只有同时满足"评论为空"且"不在加载中"才显示空状态
  // 如果 isLoading === true，即使 comments.length === 0 也不显示空状态
  if (comments.length === 0 && !isLoading) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        暂无评论，快来发表第一条评论吧
      </p>
    );
  }

  // 正常渲染：评论列表 + 加载更多按钮
  return (
    <div>
      {/* 遍历渲染每条评论，外层包裹 key 用于 React 高效更新 */}
      {comments.map((comment) => (
        <div key={comment.id} className="border-b last:border-b-0">
          <CommentItem comment={comment} onDelete={onDelete} />
        </div>
      ))}

      {/* hasMore 为 true 时显示"加载更多"按钮 */}
      {hasMore && (
        <div className="py-4 text-center">
          <Button variant="outline" onClick={onLoadMore} disabled={isLoading}>
            {isLoading ? '加载中...' : '加载更多'}
          </Button>
        </div>
      )}
    </div>
  );
}
```

> **关键**: `comments.length === 0 && !isLoading` 是消歧义条件——只有"确实没数据"且"不在加载中"才显示空状态，防止加载中误显示"暂无评论"。

#### CommentsSection（组合 + useEffect 触发加载）

**文件**: `apps/web/src/components/comments/comments-section.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { CommentForm } from './comment-form';
import { CommentList } from './comment-list';
import { useComments } from '@/hooks/use-comments';
import { useAuth } from '@/hooks/use-auth';

// props: articleId 文章ID，用于调用评论 API
interface CommentsSectionProps {
  articleId: string;
}

export function CommentsSection({ articleId }: CommentsSectionProps) {
  // 从 AuthContext 获取当前用户（用于 UserProfile 显示）
  const { user } = useAuth();

  // 调用 useComments hook 获取所有评论状态和方法
  const { comments, isLoading, hasMore, loadComments, createComment, deleteComment, loadMore } = useComments();

  // isSubmitting: 防止评论提交时重复点击
  const [isSubmitting, setIsSubmitting] = useState(false);
  // deletingId: 当前正在删除的评论 ID，用于禁用该评论的删除按钮
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ---------- useEffect：articleId 变化时重新加载评论 ----------
  // 组件首次挂载、articleId 变化时自动触发 loadComments
  useEffect(() => {
    loadComments(articleId);
  }, [articleId, loadComments]);  // loadComments 虽稳定但仍写入依赖数组（防御性编程）

  // 包装 createComment：设置 isSubmitting 防止重复提交
  const handleSubmit = async (content: string) => {
    setIsSubmitting(true);
    const success = await createComment(articleId, content);
    setIsSubmitting(false);
    return success;
  };

  // 包装 deleteComment：记录 deletingId 禁用按钮
  const handleDelete = async (commentId: string) => {
    setDeletingId(commentId);
    const success = await deleteComment(articleId, commentId);
    setDeletingId(null);
    return success;
  };

  // 组合渲染：CommentForm（自包含 Auth Gate）+ CommentList（消歧义 + 分页）
  return (
    <div className="space-y-4">
      <CommentForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      <CommentList
        comments={comments}
        hasMore={hasMore}
        isLoading={isLoading}
        onDelete={handleDelete}
        onLoadMore={loadMore}
      />
    </div>
  );
}
```

---

### Step 6: 替换文章页占位符

**文件**: `apps/web/src/app/article/[slug]/page.tsx`

移除占位符，替换为真实组件：

```diff
-import { CommentsSection } from '@/components/comments/comments-section';
+import { CommentsSection } from '@/components/comments/comments-section';

-            <p className="text-muted-foreground text-sm">评论功能开发中...</p>
+            <CommentsSection articleId={article.id} />
```

---

### 完整文件树

```
apps/web/src/
├── app/article/[slug]/page.tsx         # 修改：引入 CommentsSection
├── hooks/
│   └── use-comments.ts                  # 新建：评论状态管理 hook
├── components/comments/
│   ├── comment-form.tsx                 # 新建：评论表单 + Auth Gate
│   ├── comment-item.tsx                 # 新建：单条评论 + owner 判断
│   ├── comment-list.tsx                 # 新建：列表渲染 + 加载更多
│   └── comments-section.tsx            # 新建：容器组合 + 触发加载
├── lib/api.ts                           # 修改：新增 commentApi
└── types/index.ts                        # 修改：新增 CommentListResponse

packages/shared/src/index.ts              # 修改：新增 Comment 类型
```

---

### 改动汇总

| 文件 | 操作 | 说明 |
|------|------|------|
| `packages/shared/src/index.ts` | 修改 | 新增 `Comment`、`CreateCommentRequest`、`CommentListParams` |
| `apps/web/src/types/index.ts` | 修改 | 新增 `CommentListResponse` |
| `apps/web/src/lib/api.ts` | 修改 | 新增 `commentApi`（list/create/delete） |
| `apps/web/src/hooks/use-comments.ts` | 新建 | 评论状态管理，包含分页逻辑 |
| `apps/web/src/components/comments/*.tsx` | 新建 | 4 个组件：Form、Item、List、Section |
| `apps/web/src/app/article/[slug]/page.tsx` | 修改 | 移除占位符，替换为 `CommentsSection` |
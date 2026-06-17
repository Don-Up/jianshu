                                                          
● 问卷星详细介绍                                                           
                                                                               
  ---                                                                          
  1. react-survey-star（问卷编辑前端）                                         
                                                                                 技术栈： React 18 + TypeScript + React Router + Redux Toolkit + Ant Design + 
  Tailwind CSS                                                                                                                                                
  定位： 问卷管理后台，负责问卷的创建、编辑、发布功能                          
  已实现功能：
                                                                                 ┌──────────┬─────────────────────────────────────────────────┐               
  │   模块   │                      功能                       │
  ├──────────┼─────────────────────────────────────────────────┤
  │ 用户认证 │ 注册、登录、Token存储                           │
  ├──────────┼─────────────────────────────────────────────────┤
  │ 问卷管理 │ 列表查看、分页搜索、收藏、回收站（软删除/恢复） │
  ├──────────┼─────────────────────────────────────────────────┤
  │ 问卷编辑 │ 左侧组件库 + 中间可视化画布 + 右侧属性配置      │
  ├──────────┼─────────────────────────────────────────────────┤
  │ 题型组件 │ 7种：标题、输入框、段落、多行文本、单选、多选   │
  ├──────────┼─────────────────────────────────────────────────┤
  │ 拖拽排序 │ @dnd-kit 实现组件拖拽排序                       │
  ├──────────┼─────────────────────────────────────────────────┤
  │ 撤销重做 │ redux-undo 支持20步历史                         │
  ├──────────┼─────────────────────────────────────────────────┤
  │ 问卷统计 │ 答案列表、图表可视化（饼图/柱状图）             │
  ├──────────┼─────────────────────────────────────────────────┤
  │ 国际化   │ i18next 多语言支持                              │
  └──────────┴─────────────────────────────────────────────────┘

  ---
  2. next-questionnaire-client（问卷填写前端）

  技术栈： Next.js 15 + React 19 + Tailwind CSS 4

  定位： 问卷填写页，面向终端用户

  已实现功能：

  ┌──────────┬──────────────────────────────────────────────────────────┐      
  │   模块   │                           功能                           │      
  ├──────────┼──────────────────────────────────────────────────────────┤      
  │ 动态渲染 │ 根据后端配置动态渲染问卷组件                             │      
  ├──────────┼──────────────────────────────────────────────────────────┤      
  │ 题型组件 │ Input、Textarea、Radio、Checkbox、Title、Paragraph、Info │      
  ├──────────┼──────────────────────────────────────────────────────────┤      
  │ 表单提交 │ 答案提交到后端，根据结果跳转 success/failure 页面        │      
  ├──────────┼──────────────────────────────────────────────────────────┤      
  │ API服务  │ ajax.ts 封装 HTTP 请求                                   │      
  └──────────┴──────────────────────────────────────────────────────────┘      

  ---
  3. nest-survey-star（NestJS 后端）

  技术栈： NestJS + Prisma ORM + PostgreSQL + JWT + bcrypt

  定位： 后端 API 服务

  已实现模块：

  ┌───────────────┬────────────────────────────────────────────────┐
  │     模块      │                      接口                      │
  ├───────────────┼────────────────────────────────────────────────┤
  │ Auth          │ POST /api/auth/login - 登录验证，返回JWT       │
  ├───────────────┼────────────────────────────────────────────────┤
  │ User          │ POST /api/user/register、GET /api/user/profile │
  ├───────────────┼────────────────────────────────────────────────┤
  │ Questionnaire │ CRUD + 复制 + 软删除/恢复 + 统计               │
  ├───────────────┼────────────────────────────────────────────────┤
  │ Stat          │ POST /api/stat/answer - 提交答案、GET 答案列表 │
  └───────────────┴────────────────────────────────────────────────┘

  数据库实体： User、Questionnaire、Component、AnswerSheet、Answer

  ---
  三者关系

  react-survey-star (管理后台)
      ↓ 创建/编辑问卷 → API → nest-survey-star (后端)

  next-questionnaire-client (填写页)
      ↓ 填写答案 → API → nest-survey-star (后端)
      ↓ 获取问卷配置 → API ↗

  数据流： 用户在 react-survey-star 创建问卷 → 发布后用户在
  next-questionnaire-client 填写答案 → 答案存储到 nest-survey-star 的
  PostgreSQL 数据库


# 简书 (Jianshu) 项目概览

## 1. 项目概述

简书是一个**全栈 monorepo 项目**，使用 pnpm workspaces 组织，包含：

| 包 | 路径 | 框架 | 职责 |
|---|------|------|------|
| `@jianshu/web` | `apps/web` | Next.js 14.2 (App Router) | 前端应用 |
| `@jianshu/api` | `apps/api` | NestJS 10.3 | 后端 REST API |
| `@jianshu/shared` | `packages/shared` | TypeScript | 前后端共享类型 |

**技术栈：**
- 前端：Next.js + React + TypeScript + Tailwind CSS + shadcn/ui + TipTap (富文本编辑器) + React Query + React Hook Form
- 后端：NestJS + Prisma ORM + PostgreSQL + Passport JWT + Swagger
- 全栈：pnpm workspaces + TypeScript 严格模式

---

## 2. 后端功能列表

### 2.1 认证模块 (`AuthModule`)

| 方法 | 路由 | 认证 | 功能 |
|------|------|------|------|
| `POST` | `/api/auth/register` | 否 | 用户注册（email/password/name/username） |
| `POST` | `/api/auth/login` | 否 | 用户登录，返回 JWT token |
| `GET` | `/api/auth/me` | JWT | 获取当前登录用户信息 |
| `POST` | `/api/auth/refresh` | 否 | 刷新 access token（使用 refresh token） |
| `POST` | `/api/auth/logout` | JWT | 登出（撤销 refresh token） |

**安全特性：**
- 密码 bcrypt 加密（cost factor 10）
- JWT access token（15min）+ refresh token（7d）
- HTTP-only cookie 存储 refresh token（防止 XSS）
- 登录失败限流（同一 IP/邮箱 5 次后锁定）

### 2.2 文章模块 (`ArticlesModule`)

| 方法 | 路由 | 认证 | 功能 |
|------|------|------|------|
| `GET` | `/api/articles` | 否 | 列表文章（支持分页/作者/标签/搜索过滤） |
| `GET` | `/api/articles/:slug` | 否 | 获取单篇文章 |
| `POST` | `/api/articles` | JWT | 创建文章（title/content/excerpt/coverImage/tags） |
| `PATCH` | `/api/articles/:slug` | JWT | 更新文章（仅作者） |
| `DELETE` | `/api/articles/:slug` | JWT | 删除文章（仅作者） |
| `POST` | `/api/articles/:slug/like` | JWT | 点赞/取消点赞（toggle） |
| `POST` | `/api/articles/:slug/bookmark` | JWT | 收藏/取消收藏（toggle） |

**搜索功能：**
- `GET /api/articles?search=<term>` — 按 title 和 content 模糊搜索（Prisma `contains` + case-insensitive mode）
- 返回结果按 `createdAt` 倒序

**数据模型：**
- Article → User（一对多，作者）
- Article → Tag（多对多，通过 `TagsOnArticles` join table）
- Article → Comment（一对多）
- Article → Like/Bookmark（与 User 的多对多）

### 2.3 用户模块 (`UsersModule`)

| 方法 | 路由 | 认证 | 功能 |
|------|------|------|------|
| `GET` | `/api/users/:username` | 否 | 获取用户公开资料（profile + stats） |
| `PATCH` | `/api/users/me` | JWT | 修改个人资料（name/bio/avatar） |
| `POST` | `/api/users/me/change-password` | JWT | 修改密码（验证旧密码） |
| `POST` | `/api/users/:userId/follow` | JWT | 关注/取消关注（toggle） |
| `GET` | `/api/users/:username/followers` | 否 | 获取用户的粉丝列表 |
| `GET` | `/api/users/:username/following` | 否 | 获取用户关注的人列表 |
| `GET` | `/api/users/:username/articles` | 否 | 获取用户发布的文章列表 |

### 2.4 评论模块 (`CommentsModule`)

| 方法 | 路由 | 认证 | 功能 |
|------|------|------|------|
| `GET` | `/api/articles/:articleId/comments` | 否 | 获取文章的评论列表（分页） |
| `POST` | `/api/articles/:articleId/comments` | JWT | 发表评论（content，最大 2000 字符） |
| `DELETE` | `/api/articles/:articleId/comments/:id` | JWT | 删除评论（仅作者） |

### 2.5 通知模块 (`NotificationsModule`)

| 方法 | 路由 | 认证 | 功能 |
|------|------|------|------|
| `GET` | `/api/notifications` | JWT | 获取当前用户的通知列表（分页） |
| `GET` | `/api/notifications/unread-count` | JWT | 获取未读通知数量 |
| `POST` | `/api/notifications/:id/read` | JWT | 标记单条通知为已读 |
| `POST` | `/api/notifications/read-all` | JWT | 全部标记为已读 |

**通知类型：** `comment`（有人评论你的文章）、`like`（有人点赞你的文章）、`follow`（有人关注你）

### 2.6 后端安全与基础设施

**`main.ts` 全局配置：**
- Helmet 安全头（CSP、X-Frame-Options 等）
- CORS（支持前端 `localhost:3000`）
- 全局 Throttler（限流 100 req/min）
- Class Validator + Class Transformer（DTO 校验和转换）
- Swagger 文档（`/api/docs`）
- 全局异常过滤器（统一错误响应格式）
- 全局响应拦截器（统一包装 `{ success, data, error }`）

---

## 3. 前端功能列表

### 3.1 页面路由

| 页面 | 路径 | 认证 | 功能 |
|------|------|------|------|
| 首页 | `/` | 否 | 发现页 — 文章列表（分页加载） |
| 登录 | `/login` | 否 | 登录表单 |
| 注册 | `/register` | 否 | 注册表单 |
| 文章详情 | `/article/[slug]` | 否 | 文章正文 + 评论（Task 4） |
| 写文章 | `/write` | JWT | 创建文章（TipTap 富文本编辑器） |
| 编辑文章 | `/write?slug=<slug>` | JWT | 编辑已有文章 |
| 个人设置 | `/settings` | JWT | 修改个人信息 / 修改密码 |
| 用户主页 | `/user/[username]` | 否 | 用户公开主页 + 文章列表 |
| 搜索结果 | `/search?q=<term>` | 否 | 搜索结果页（Task 5） |

### 3.2 前端组件

**UI 组件**（`shadcn/ui`）：
- `Button` — 变体：default/ghost/outline/destructive
- `Input` — 表单输入框
- `Textarea` — 多行文本框
- `Card/CardContent` — 卡片容器
- `Avatar/AvatarFallback/AvatarImage` — 用户头像
- `Label` — 表单标签
- `Sonner` — Toast 通知（`sonner.toast()`）

**认证组件：**
- `AuthProvider` — React Context，封装 `useAuth` hook
- `LoginForm` — 邮箱/密码登录 + 注册链接
- `RegisterForm` — 邮箱/密码/用户名/昵称注册

**布局组件：**
- `PageLayout` — 包含 Header + Footer 的全屏布局
- `Header` — 顶栏：Logo + 导航 + 搜索框（Task 5）+ 用户菜单
- `Footer` — 底栏（可配置显示/隐藏）
- `SearchBar` — 搜索输入框 + 提交表单（Task 5）

**文章组件：**
- `ArticleCard` — 文章预览卡片：封面图 + 标题 + 摘要 + 作者 + 统计数据
- `ArticleList` — 列表容器：骨架屏 + 空状态 + 渲染 ArticleCard
- `ArticleContent` — 文章正文渲染：Markdown/HTML + 操作按钮（点赞/编辑）
- `ArticleEditor` — TipTap 富文本编辑器 + 格式化工具栏

**TipTap 组件：**
- `TiptapEditor` — 核心编辑器，SSR 兼容配置
- `TiptapToolbar` — 工具栏：加粗/斜体/下划线/删除线/标题/列表/引用/代码/链接/图片/分割线

**评论组件：**
- `CommentsSection` — 容器：管理评论加载和操作
- `CommentForm` — 输入框 + 提交（未登录显示登录链接）
- `CommentList` — 列表 + 分页加载
- `CommentItem` — 单条评论：头像 + 昵称 + 时间 + 内容 + 删除按钮

### 3.3 Hooks

| Hook | 文件 | 功能 |
|------|------|------|
| `useAuth` | `hooks/use-auth.tsx` | 登录/注册/登出/当前用户状态/权限判断 |
| `useArticle` | `hooks/use-article.ts` | 获取文章详情/点赞 toggle |
| `useComments` | `hooks/use-comments.ts` | 评论列表/创建/删除/分页加载（Task 4） |
| `useSearch` | `hooks/use-search.ts` | 搜索结果/分页加载（Task 5） |

### 3.4 API 层

**`api.ts` 导出的 API 对象：**

| API 对象 | 方法 | 说明 |
|---------|------|------|
| `authApi` | `login`, `register`, `me`, `logout`, `refresh`, `changePassword` | 认证相关 |
| `articleApi` | `list`, `getBySlug`, `create`, `update`, `delete`, `like`, `bookmark` | 文章 CRUD + 互动 |
| `userApi` | `getByUsername`, `follow`, `getArticles` | 用户主页 + 关注 |
| `commentApi` | `list`, `create`, `delete` | 评论 CRUD（Task 4） |

**统一响应包装：** 所有 API 通过 `fetchApi<T>()` 封装，返回 `{ success, data, error }` 统一格式。

### 3.5 中间件 (`middleware.ts`)

- 保护路由：`/write`、`/settings`
- 公开路由：`/login`、`/register`、静态资源
- JWT 验证：解析 `Authorization: Bearer <token>` 或 HTTP-only cookie
- 自动刷新：access token 过期时自动调用 `/api/auth/refresh` 并重试
- 未登录重定向：保护路由访问时 redirect 到 `/login?callback=<path>`

### 3.6 前端安全

- HTTP-only cookies 存储 JWT（Task 2 新增）
- 双写策略：同时写入 cookies + localStorage，平稳迁移
- API 代理路由：`/api/auth/*` 代理到后端，支持设置 HTTP-only cookie
- 401 自动刷新：`fetchApi` 拦截 401，调用 refresh 后重试请求

---

## 4. 数据模型（Prisma Schema）

```
User
  ├── articles (1:N Article)
  ├── comments (1:N Comment)
  ├── likes (N:M Article)
  ├── bookmarks (N:M Article)
  ├── followers (N:M User, through Follow)
  ├── following (N:M User, through Follow)
  ├── notifications (1:N Notification)
  └── refreshTokens (1:N RefreshToken)

Article
  ├── author (N:1 User)
  ├── comments (1:N Comment)
  ├── likes (N:M User)
  ├── bookmarks (N:M User)
  └── tags (N:M Tag, through TagsOnArticles)

Comment
  ├── author (N:1 User)
  └── article (N:1 Article)

Notification
  ├── user (N:1 User) — 接收者
  ├── actor (N:1 User) — 触发者
  └── article (N:1 Article, optional)

Follow
  ├── follower (N:1 User)
  └── following (N:1 User)

RefreshToken
  └── user (N:1 User)
```

---

## 5. 共享类型（`@jianshu/shared`）

```typescript
// 核心类型
ApiResponse<T>       // 统一 API 响应 { success, data, error }
PaginatedResponse<T>  // 分页响应 { items, total, page, limit, totalPages }
PaginationParams     // 分页参数 { page, limit }

// 业务类型
User                 // 用户基本信息
Article             // 文章（含 author、tags、计数、是否点赞/收藏）
Comment             // 评论（含 author pick）
Notification        // 通知（含 actor、article）

// 请求 DTO
LoginRequest        // email + password
RegisterRequest     // email + password + name + username
CreateArticleRequest // title + content + excerpt + coverImage + tags
CreateCommentRequest // content

// 查询参数
ArticleListParams   // page + limit + authorId + tag + search
CommentListParams   // page + limit
```

---

## 6. 已完成的功能版本

### Backend v2（已完成）

| Task | 内容 |
|------|------|
| Task 1 | 评论模块（GET/POST/DELETE） |
| Task 2 | 通知模块（列表/未读数/标记已读） |
| Task 3 | Refresh Token + 增强 Auth（refresh token 轮换） |
| Task 4 | 安全增强（Rate Limiting/Helmet/Logging） |
| Task 5 | 密码修改端点（`POST /api/users/me/change-password`） |

### Frontend v2（已完成）

| Task | 内容 |
|------|------|
| Task 2 | 服务端 Auth Middleware（HTTP-only cookies + JWT 验证 + 自动刷新） |
| Task 3 | TipTap 富文本编辑器（加粗/斜体/标题/列表/引用/代码/链接/图片） |
| Task 4 | 评论系统（查看/创建/删除/分页，UI 权限控制） |
| Task 5 | 搜索功能（Header 搜索框 + `/search?q=` 结果页 + 分页加载） |

---

## 7. 项目启动方式

```bash
# 安装依赖
pnpm install

# 启动前端（localhost:3000）
pnpm dev

# 启动后端（localhost:4000）
pnpm dev:api

# 启动 Storybook
pnpm storybook

# 构建所有包
pnpm build

# 运行测试
pnpm test

# 运行所有测试
pnpm --filter @jianshu/web test --run
```
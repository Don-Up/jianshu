// Shared types for jianshu monorepo

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar?: string | null;
  bio?: string | null;
  followerCount?: number;
  followingCount?: number;
  articleCount?: number;
  createdAt: Date;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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

// Comment types
export interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  author: Pick<User, 'id' | 'username' | 'name' | 'avatar'>;
}

export interface CreateCommentRequest {
  content: string;
}

export interface CommentListParams extends PaginationParams {}

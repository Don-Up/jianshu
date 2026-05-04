import type { Article, User, ApiResponse, PaginatedResponse } from '@jianshu/shared';

// Extend with frontend-only types
export interface ArticleWithAuthor extends Article {
  author: User;
}

export type ArticleListResponse = PaginatedResponse<ArticleWithAuthor>;
export type ArticleResponse = ApiResponse<ArticleWithAuthor>;
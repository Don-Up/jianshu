import type { Article, User, ApiResponse, PaginatedResponse } from '@jianshu/shared';

export interface ArticleWithAuthor extends Article {
  author: User;
}

export type ArticleListResponse = PaginatedResponse<ArticleWithAuthor>;
export type ArticleResponse = ApiResponse<ArticleWithAuthor>;

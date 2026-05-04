import type { Article, User, ApiResponse, PaginatedResponse } from '@jianshu/shared';

<<<<<<< HEAD
=======
// Extend with frontend-only types
>>>>>>> c1b9c24836a4365a9449ce73fcf701f2d25b5858
export interface ArticleWithAuthor extends Article {
  author: User;
}

export type ArticleListResponse = PaginatedResponse<ArticleWithAuthor>;
<<<<<<< HEAD
export type ArticleResponse = ApiResponse<ArticleWithAuthor>;
=======
export type ArticleResponse = ApiResponse<ArticleWithAuthor>;
>>>>>>> c1b9c24836a4365a9449ce73fcf701f2d25b5858

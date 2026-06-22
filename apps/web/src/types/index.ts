import type { Article, User, ApiResponse, PaginatedResponse, Comment } from '@jianshu/shared';

export interface ArticleWithAuthor extends Article {
  author: User;
}

export type ArticleListResponse = PaginatedResponse<ArticleWithAuthor>;
export type ArticleResponse = ApiResponse<ArticleWithAuthor>;

// Nested comment structure for nested replies
export interface CommentNode {
  id: string;
  content: string;
  authorId: string;
  author: { id: string; username: string; name: string; avatar: string | null };
  likeCount: number;
  isLiked: boolean;
  createdAt: string;
  parentId: string | null;
  replies: CommentNode[];
}

export type CommentListResponse = CommentNode[];

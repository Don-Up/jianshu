import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

export interface CommentNode {
  id: string;
  content: string;
  authorId: string;
  author: { id: string; username: string; name: string; avatar: string | null };
  likeCount: number;
  isLiked: boolean;
  createdAt: Date;
  parentId: string | null;
  replies: CommentNode[];
}

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(slug: string, authorId: string, dto: CreateCommentDto) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
    });

    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    // If parentId provided, verify parent comment exists and belongs to same article
    if (dto.parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
      });

      if (!parentComment) {
        throw new NotFoundException('父评论不存在');
      }

      if (parentComment.articleId !== article.id) {
        throw new BadRequestException('父评论不属于该文章');
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        content: dto.content,
        authorId,
        articleId: article.id,
        parentId: dto.parentId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Update comment count on article (only for top-level comments)
    if (!dto.parentId) {
      await this.prisma.article.update({
        where: { id: article.id },
        data: { commentCount: { increment: 1 } },
      });
    }

    return {
      success: true,
      data: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        author: comment.author,
        parentId: comment.parentId,
        likeCount: 0,
        isLiked: false,
        replies: [],
      },
    };
  }

  async findByArticle(slug: string, userId?: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
    });

    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    const comments = await this.prisma.comment.findMany({
      where: { articleId: article.id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        likes: userId
          ? {
              where: { userId },
              select: { userId: true },
            }
          : false,
        _count: {
          select: { likes: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Build nested tree structure
    const nested = this.buildCommentTree(comments, userId);

    return {
      success: true,
      data: nested,
    };
  }

  private buildCommentTree(comments: any[], userId?: string): CommentNode[] {
    const map = new Map<string, CommentNode>();
    const roots: CommentNode[] = [];

    // First pass: create all nodes
    for (const comment of comments) {
      const isLiked = userId ? comment.likes?.some((l: any) => l.userId === userId) : false;
      const node: CommentNode = {
        id: comment.id,
        content: comment.content,
        authorId: comment.authorId,
        author: comment.author,
        likeCount: comment._count?.likes || 0,
        isLiked,
        createdAt: comment.createdAt,
        parentId: comment.parentId,
        replies: [],
      };
      map.set(comment.id, node);
    }

    // Second pass: build tree
    for (const comment of comments) {
      const node = map.get(comment.id)!;
      if (comment.parentId && map.has(comment.parentId)) {
        map.get(comment.parentId)!.replies.push(node);
      } else if (!comment.parentId) {
        roots.push(node);
      }
    }

    return roots;
  }

  async delete(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { _count: { select: { replies: true } } },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('无权删除此评论');
    }

    // If has replies, soft delete by clearing content instead of hard delete
    // This preserves the reply chain
    if (comment._count.replies > 0) {
      await this.prisma.comment.update({
        where: { id: commentId },
        data: { content: '[已删除]' },
      });
    } else {
      await this.prisma.comment.delete({
        where: { id: commentId },
      });

      // Decrement comment count only for top-level comments with no replies
      if (!comment.parentId) {
        await this.prisma.article.update({
          where: { id: comment.articleId },
          data: { commentCount: { decrement: 1 } },
        });
      }
    }

    return { success: true };
  }

  async likeComment(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    // Check if already liked
    const existingLike = await this.prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });

    if (existingLike) {
      throw new BadRequestException('已经点赞过该评论');
    }

    await this.prisma.commentLike.create({
      data: {
        commentId,
        userId,
      },
    });

    const likeCount = await this.prisma.commentLike.count({
      where: { commentId },
    });

    return {
      success: true,
      data: { likeCount },
    };
  }

  async unlikeComment(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    const existingLike = await this.prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });

    if (!existingLike) {
      throw new BadRequestException('还未点赞该评论');
    }

    await this.prisma.commentLike.delete({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });

    const likeCount = await this.prisma.commentLike.count({
      where: { commentId },
    });

    return {
      success: true,
      data: { likeCount },
    };
  }
}

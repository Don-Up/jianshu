import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { QueryCommentDto } from './dto/query-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(articleId: string, authorId: string, dto: CreateCommentDto) {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    const comment = await this.prisma.comment.create({
      data: {
        content: dto.content,
        authorId,
        articleId,
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

    // Update comment count on article
    await this.prisma.article.update({
      where: { id: articleId },
      data: { commentCount: { increment: 1 } },
    });

    return {
      success: true,
      data: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        author: comment.author,
      },
    };
  }

  async findByArticle(articleId: string, query: QueryCommentDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { articleId },
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
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.comment.count({ where: { articleId } }),
    ]);

    return {
      success: true,
      data: {
        items: comments.map((c) => ({
          id: c.id,
          content: c.content,
          createdAt: c.createdAt,
          author: c.author,
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async delete(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('无权删除此评论');
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    // Update comment count
    await this.prisma.article.update({
      where: { id: comment.articleId },
      data: { commentCount: { decrement: 1 } },
    });

    return { success: true };
  }
}
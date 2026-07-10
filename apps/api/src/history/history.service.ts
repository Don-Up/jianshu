import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { QueryHistoryDto } from './dto/query-history.dto';

@Injectable()
export class HistoryService {
  constructor(private prisma: PrismaService) {}

  async recordView(userId: string, articleSlug: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug: articleSlug },
    });

    if (!article) {
      return { success: false, message: 'Article not found' };
    }

    // Upsert: update viewedAt if exists, create if not
    await this.prisma.readingHistory.upsert({
      where: {
        userId_articleId: {
          userId,
          articleId: article.id,
        },
      },
      update: {
        viewedAt: new Date(),
      },
      create: {
        userId,
        articleId: article.id,
      },
    });

    return { success: true };
  }

  async getHistory(userId: string, query: QueryHistoryDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      this.prisma.readingHistory.findMany({
        where: { userId },
        include: {
          article: {
            select: {
              id: true,
              title: true,
              slug: true,
              excerpt: true,
              coverImage: true,
              published: true,
              createdAt: true,
              author: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { viewedAt: 'desc' },
      }),
      this.prisma.readingHistory.count({ where: { userId } }),
    ]);

    return {
      success: true,
      data: {
        items: history.map((h) => ({
          article: h.article,
          viewedAt: h.viewedAt,
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async removeFromHistory(userId: string, articleId: string) {
    await this.prisma.readingHistory.deleteMany({
      where: {
        userId,
        articleId,
      },
    });

    return { success: true };
  }

  async clearHistory(userId: string) {
    await this.prisma.readingHistory.deleteMany({
      where: { userId },
    });

    return { success: true };
  }
}

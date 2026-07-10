import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { QueryFeedDto } from './dto/query-feed.dto';

@Injectable()
export class FeedService {
  constructor(private prisma: PrismaService) {}

  async getHomeFeed(userId: string, query: QueryFeedDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    // Get articles from users that the current user follows
    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where: {
          published: true,
          author: {
            followers: {
              some: {
                followerId: userId,
              },
            },
          },
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
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.article.count({
        where: {
          published: true,
          author: {
            followers: {
              some: {
                followerId: userId,
              },
            },
          },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        items: articles,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getRecommendedFeed(userId: string, query: QueryFeedDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    // Get articles the user hasn't read yet, ordered by likeCount and createdAt
    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where: {
          published: true,
          // Exclude articles the user has already read
          NOT: {
            id: {
              in: await this.prisma.readingHistory.findMany({
                where: { userId },
                select: { articleId: true },
              }).then((history) => history.map((h) => h.articleId)),
            },
          },
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
        skip,
        take: limit,
        orderBy: [
          { likeCount: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      this.prisma.article.count({
        where: {
          published: true,
          NOT: {
            id: {
              in: await this.prisma.readingHistory.findMany({
                where: { userId },
                select: { articleId: true },
              }).then((history) => history.map((h) => h.articleId)),
            },
          },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        items: articles,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getArticleAnalytics(slug: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: {
        shares: true,
        author: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Group shares by platform
    const sharesByPlatform: Record<string, number> = {};
    for (const share of article.shares) {
      sharesByPlatform[share.platform] = (sharesByPlatform[share.platform] || 0) + 1;
    }

    const totalShares = article.shares.length;

    return {
      success: true,
      data: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        stats: {
          likes: article.likeCount,
          comments: article.commentCount,
          reads: article.readCount,
          shares: totalShares,
          sharesByPlatform,
        },
        author: article.author,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
      },
    };
  }

  async getUserAnalytics(authorUsername: string) {
    const user = await this.prisma.user.findUnique({
      where: { username: authorUsername },
      include: {
        articles: {
          select: {
            id: true,
            likeCount: true,
            commentCount: true,
            readCount: true,
          },
        },
        followers: true,
        following: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Aggregate article stats
    const totalLikes = user.articles.reduce((sum, a) => sum + a.likeCount, 0);
    const totalComments = user.articles.reduce((sum, a) => sum + a.commentCount, 0);
    const totalReads = user.articles.reduce((sum, a) => sum + a.readCount, 0);

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
        },
        stats: {
          articlesCount: user.articles.length,
          totalLikes,
          totalComments,
          totalReads,
          followersCount: user.followers.length,
          followingCount: user.following.length,
        },
      },
    };
  }
}

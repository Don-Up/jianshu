import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ShareService {
  constructor(private prisma: PrismaService) {}

  async create(articleSlug: string, platform: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug: articleSlug },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const share = await this.prisma.share.create({
      data: {
        articleId: article.id,
        platform,
      },
    });

    return {
      success: true,
      data: share,
    };
  }

  async getShares(articleSlug: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug: articleSlug },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const shares = await this.prisma.share.groupBy({
      by: ['platform'],
      where: { articleId: article.id },
      _count: true,
    });

    const total = await this.prisma.share.count({
      where: { articleId: article.id },
    });

    const byPlatform = shares.reduce(
      (acc, s) => {
        acc[s.platform] = s._count;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      success: true,
      data: {
        total,
        byPlatform,
      },
    };
  }
}

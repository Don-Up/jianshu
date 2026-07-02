import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface ArticleVersionData {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  version: number;
  createdAt: Date;
  articleId: string;
}

@Injectable()
export class VersionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(articleSlug: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug: articleSlug },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const versions = await this.prisma.articleVersion.findMany({
      where: { articleId: article.id },
      orderBy: { version: 'desc' },
    });

    return {
      success: true,
      data: versions.map((v) => ({
        id: v.id,
        title: v.title,
        content: v.content,
        excerpt: v.excerpt,
        version: v.version,
        createdAt: v.createdAt,
      })),
    };
  }

  async findOne(articleSlug: string, versionId: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug: articleSlug },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const version = await this.prisma.articleVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.articleId !== article.id) {
      throw new NotFoundException('Version not found');
    }

    return {
      success: true,
      data: {
        id: version.id,
        title: version.title,
        content: version.content,
        excerpt: version.excerpt,
        version: version.version,
        createdAt: version.createdAt,
      },
    };
  }

  async restore(articleSlug: string, versionId: string, userId: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug: articleSlug },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (article.authorId !== userId) {
      throw new NotFoundException('Not authorized');
    }

    const version = await this.prisma.articleVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.articleId !== article.id) {
      throw new NotFoundException('Version not found');
    }

    // Save current version before restoring
    await this.saveVersion(article.id, article, version.version + 1);

    // Restore the article to the selected version
    const updated = await this.prisma.article.update({
      where: { id: article.id },
      data: {
        title: version.title,
        content: version.content,
        excerpt: version.excerpt,
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
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        id: updated.id,
        title: updated.title,
        slug: updated.slug,
        content: updated.content,
        excerpt: updated.excerpt,
        version: version.version,
      },
    };
  }

  async saveVersion(articleId: string, article: { title: string; content: string; excerpt: string | null }, versionNumber: number) {
    return this.prisma.articleVersion.create({
      data: {
        articleId,
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        version: versionNumber,
      },
    });
  }

  async getLatestVersionNumber(articleId: string): Promise<number> {
    const latest = await this.prisma.articleVersion.findFirst({
      where: { articleId },
      orderBy: { version: 'desc' },
    });
    return latest?.version ?? 0;
  }
}

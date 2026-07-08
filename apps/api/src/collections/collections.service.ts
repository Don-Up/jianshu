import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';

@Injectable()
export class CollectionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateCollectionDto) {
    const collection = await this.prisma.collection.create({
      data: {
        name: dto.name,
        description: dto.description,
        isPublic: dto.isPublic ?? false,
        userId,
      },
    });

    return {
      success: true,
      data: collection,
    };
  }

  async findAll(userId?: string) {
    if (!userId) {
      return { success: true, data: [] };
    }
    const collections = await this.prisma.collection.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            article: {
              select: {
                id: true,
                title: true,
                slug: true,
                coverImage: true,
              },
            },
          },
          orderBy: { addedAt: 'desc' },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return {
      success: true,
      data: collections.map((c) => ({
        ...c,
        previewItems: c.items.slice(0, 4).map((i) => i.article),
        articleCount: c._count.items,
      })),
    };
  }

  async findOne(id: string, userId?: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            article: {
              select: {
                id: true,
                title: true,
                slug: true,
                coverImage: true,
                excerpt: true,
                likeCount: true,
                commentCount: true,
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
          orderBy: { addedAt: 'desc' },
        },
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    // Check access: must be owner or public
    if (!collection.isPublic && collection.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return {
      success: true,
      data: {
        ...collection,
        articleCount: collection._count.items,
      },
    };
  }

  async update(id: string, userId: string, dto: UpdateCollectionDto) {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const updated = await this.prisma.collection.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        isPublic: dto.isPublic,
      },
    });

    return {
      success: true,
      data: updated,
    };
  }

  async delete(id: string, userId: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.collection.delete({
      where: { id },
    });

    return { success: true };
  }

  async addArticle(collectionId: string, articleSlug: string, userId: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const article = await this.prisma.article.findUnique({
      where: { slug: articleSlug },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Check if already in collection
    const existing = await this.prisma.collectionItem.findUnique({
      where: {
        collectionId_articleId: {
          collectionId,
          articleId: article.id,
        },
      },
    });

    if (existing) {
      return { success: true, data: { message: 'Already in collection' } };
    }

    await this.prisma.collectionItem.create({
      data: {
        collectionId,
        articleId: article.id,
      },
    });

    // Update collection timestamp
    await this.prisma.collection.update({
      where: { id: collectionId },
      data: { updatedAt: new Date() },
    });

    return { success: true };
  }

  async removeArticle(collectionId: string, articleId: string, userId: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.collectionItem.delete({
      where: {
        collectionId_articleId: {
          collectionId,
          articleId,
        },
      },
    });

    return { success: true };
  }

  async toggleBookmark(userId: string, articleSlug: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug: articleSlug },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const existing = await this.prisma.bookmark.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId: article.id,
        },
      },
    });

    if (existing) {
      await this.prisma.bookmark.delete({
        where: {
          userId_articleId: {
            userId,
            articleId: article.id,
          },
        },
      });
      return { success: true, data: { bookmarked: false } };
    } else {
      await this.prisma.bookmark.create({
        data: {
          userId,
          articleId: article.id,
        },
      });
      return { success: true, data: { bookmarked: true } };
    }
  }

  async getBookmarks(userId: string) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId },
      include: {
        article: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
            excerpt: true,
            likeCount: true,
            commentCount: true,
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
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: bookmarks.map((b) => b.article),
    };
  }
}

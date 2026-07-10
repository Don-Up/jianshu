import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RedisService } from '../redis/redis.service';
import { NotificationsService } from '../notifications/notifications.service';
import { VersionsService } from '../versions/versions.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticleDto } from './dto/query-article.dto';

@Injectable()
export class ArticlesService {
  private logger = new Logger('ArticlesService');

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private notificationsService: NotificationsService,
    private versionsService: VersionsService,
  ) {}

  private generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9一-龥]+/g, '-')
      .replace(/^-|-$/g, '');
    const suffix = Math.random().toString(36).substring(2, 8);
    return `${base}-${suffix}`;
  }

  async create(authorId: string, dto: CreateArticleDto) {
    const slug = this.generateSlug(dto.title);

    const article = await this.prisma.article.create({
      data: {
        title: dto.title,
        slug,
        content: dto.content,
        excerpt: dto.excerpt,
        coverImage: dto.coverImage,
        authorId,
        tags: dto.tags && dto.tags.length > 0
          ? {
              create: dto.tags.map((name) => ({
                tag: {
                  connectOrCreate: {
                    where: { name },
                    create: { name },
                  },
                },
              })),
            }
          : undefined,
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

    // Invalidate article list cache
    await this.redis.delPattern('articles:list:*');

    return {
      success: true,
      data: this.formatArticle(article),
    };
  }

  async findAll(query: QueryArticleDto, userId?: string) {
    const { page = 1, limit = 20, authorId, tag, search, createdAfter } = query;

    // Try cache first
    const cacheKey = `articles:list:${JSON.stringify({ page, limit, authorId, tag, search, createdAfter })}:${userId || 'anonymous'}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.log(`[CACHE HIT] findAll - key: ${cacheKey}`);
      return JSON.parse(cached);
    }

    this.logger.log(`[CACHE MISS] findAll - key: ${cacheKey}, fetching from DB`);

    const skip = (page - 1) * limit;

    const where: any = {
      published: true,
    };

    if (authorId) {
      where.authorId = authorId;
    }

    if (tag) {
      where.tags = {
        some: {
          tag: {
            name: tag,
          },
        },
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (createdAfter) {
      where.createdAt = {
        gte: new Date(createdAfter),
      };
    }

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
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
          likes: userId ? { where: { userId } } : false,
          bookmarks: userId ? { where: { userId } } : false,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.article.count({ where }),
    ]);

    const result = {
      success: true,
      data: {
        items: articles.map((a) => this.formatArticle(a, userId)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache for 5 minutes
    await this.redis.set(cacheKey, JSON.stringify(result), 300);
    this.logger.log(`[CACHE SET] findAll - key: ${cacheKey}, ttl: 300s, items: ${total}`);

    return result;
  }

  async findBySlug(slug: string, userId?: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            bio: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        likes: userId ? { where: { userId } } : false,
        bookmarks: userId ? { where: { userId } } : false,
      },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    await this.prisma.article.update({
      where: { id: article.id },
      data: { readCount: { increment: 1 } },
    });

    return {
      success: true,
      data: this.formatArticle(article, userId),
    };
  }

  async update(slug: string, userId: string, dto: UpdateArticleDto) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (article.authorId !== userId) {
      throw new ForbiddenException('Not authorized to update this article');
    }

    // Save current version before updating
    const versionNumber = (await this.versionsService.getLatestVersionNumber(article.id)) + 1;
    await this.versionsService.saveVersion(article.id, {
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
    }, versionNumber);

    let tags: any = undefined;
    if (dto.tags !== undefined) {
      // Delete existing tags and create new ones
      await this.prisma.tagsOnArticles.deleteMany({
        where: { articleId: article.id },
      });

      if (dto.tags.length > 0) {
        tags = {
          create: dto.tags.map((name) => ({
            tag: {
              connectOrCreate: {
                where: { name },
                create: { name },
              },
            },
          })),
        };
      }
    }

    const updated = await this.prisma.article.update({
      where: { id: article.id },
      data: {
        title: dto.title,
        content: dto.content,
        excerpt: dto.excerpt,
        coverImage: dto.coverImage,
        tags,
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

    // Invalidate article list cache
    await this.redis.delPattern('articles:list:*');

    return {
      success: true,
      data: this.formatArticle(updated),
    };
  }

  async delete(slug: string, userId: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (article.authorId !== userId) {
      throw new ForbiddenException('Not authorized to delete this article');
    }

    await this.prisma.article.delete({
      where: { id: article.id },
    });

    // Invalidate article list cache
    await this.redis.delPattern('articles:list:*');

    return {
      success: true,
      message: 'Article deleted',
    };
  }

  async like(articleSlug: string, userId: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug: articleSlug },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId: article.id,
        },
      },
    });

    if (existingLike) {
      await this.prisma.like.delete({
        where: {
          userId_articleId: {
            userId,
            articleId: article.id,
          },
        },
      });

      await this.prisma.article.update({
        where: { id: article.id },
        data: { likeCount: { decrement: 1 } },
      });

      // Invalidate article list cache
      await this.redis.delPattern('articles:list:*');

      return {
        success: true,
        data: { likeCount: article.likeCount - 1, isLiked: false },
      };
    } else {
      await this.prisma.like.create({
        data: {
          userId,
          articleId: article.id,
        },
      });

      await this.prisma.article.update({
        where: { id: article.id },
        data: { likeCount: { increment: 1 } },
      });

      // Invalidate article list cache
      await this.redis.delPattern('articles:list:*');

      // Create LIKE notification for the article author
      if (article.authorId !== userId) {
        await this.notificationsService.createNotification({
          userId: article.authorId,
          type: 'LIKE',
          message: '赞了你的文章',
          actorId: userId,
          articleId: article.id,
          link: `/article/${articleSlug}`,
        });
      }

      return {
        success: true,
        data: { likeCount: article.likeCount + 1, isLiked: true },
      };
    }
  }

  async bookmark(articleSlug: string, userId: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug: articleSlug },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const existingBookmark = await this.prisma.bookmark.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId: article.id,
        },
      },
    });

    if (existingBookmark) {
      await this.prisma.bookmark.delete({
        where: {
          userId_articleId: {
            userId,
            articleId: article.id,
          },
        },
      });

      return {
        success: true,
        data: { isBookmarked: false },
      };
    } else {
      await this.prisma.bookmark.create({
        data: {
          userId,
          articleId: article.id,
        },
      });

      return {
        success: true,
        data: { isBookmarked: true },
      };
    }
  }

  private formatArticle(article: any, userId?: string) {
    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt,
      coverImage: article.coverImage,
      likeCount: article.likeCount,
      commentCount: article.commentCount,
      readCount: article.readCount,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      author: article.author,
      tags: article.tags?.map((t: any) => t.tag.name) || [],
      isLiked: article.likes?.length > 0 || false,
      isBookmarked: article.bookmarks?.length > 0 || false,
    };
  }
}

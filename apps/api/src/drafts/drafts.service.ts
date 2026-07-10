import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateArticleDto } from '../articles/dto/create-article.dto';
import { UpdateArticleDto } from '../articles/dto/update-article.dto';
import { QueryDraftsDto } from './dto/query-drafts.dto';

@Injectable()
export class DraftsService {
  constructor(private prisma: PrismaService) {}

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
        published: false, // Draft by default
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

    return {
      success: true,
      data: this.formatArticle(article),
    };
  }

  async findAll(authorId: string, query: QueryDraftsDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where: {
          authorId,
          published: false, // Only drafts
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
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.article.count({
        where: {
          authorId,
          published: false,
        },
      }),
    ]);

    return {
      success: true,
      data: {
        items: articles.map((a) => this.formatArticle(a)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(authorId: string, slug: string) {
    const article = await this.prisma.article.findFirst({
      where: {
        slug,
        authorId,
        published: false, // Only drafts
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

    if (!article) {
      throw new NotFoundException('Draft not found');
    }

    return {
      success: true,
      data: this.formatArticle(article),
    };
  }

  async update(authorId: string, slug: string, dto: UpdateArticleDto) {
    const article = await this.prisma.article.findFirst({
      where: {
        slug,
        authorId,
        published: false,
      },
    });

    if (!article) {
      throw new NotFoundException('Draft not found');
    }

    const updated = await this.prisma.article.update({
      where: { id: article.id },
      data: {
        title: dto.title,
        content: dto.content,
        excerpt: dto.excerpt,
        coverImage: dto.coverImage,
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
      data: this.formatArticle(updated),
    };
  }

  async delete(authorId: string, slug: string) {
    const article = await this.prisma.article.findFirst({
      where: {
        slug,
        authorId,
        published: false,
      },
    });

    if (!article) {
      throw new NotFoundException('Draft not found');
    }

    await this.prisma.article.delete({
      where: { id: article.id },
    });

    return { success: true };
  }

  async publish(authorId: string, slug: string) {
    const article = await this.prisma.article.findFirst({
      where: {
        slug,
        authorId,
        published: false,
      },
    });

    if (!article) {
      throw new NotFoundException('Draft not found');
    }

    const published = await this.prisma.article.update({
      where: { id: article.id },
      data: {
        published: true,
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
      data: this.formatArticle(published),
    };
  }

  private formatArticle(article: any) {
    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt,
      coverImage: article.coverImage,
      published: article.published,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      author: article.author,
      tags: article.tags?.map((t: any) => t.tag.name) || [],
    };
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ArticlesService } from '../articles.service';
import { PrismaService } from '../../prisma.service';

describe('ArticlesService', () => {
  let articlesService: ArticlesService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUser = {
    id: 'user-123',
    username: 'testuser',
    name: 'Test User',
    avatar: null,
  };

  const mockArticle = {
    id: 'article-123',
    title: 'Test Article',
    slug: 'test-article-abc123',
    content: 'This is test content',
    excerpt: 'Excerpt',
    coverImage: null,
    likeCount: 0,
    commentCount: 0,
    readCount: 0,
    published: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    authorId: 'user-123',
    author: mockUser,
    tags: [],
    likes: [],
    bookmarks: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        {
          provide: PrismaService,
          useValue: {
            article: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            like: {
              findUnique: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
            bookmark: {
              findUnique: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
            tagsOnArticles: {
              deleteMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    articlesService = module.get<ArticlesService>(ArticlesService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an article', async () => {
      prismaService.article.create = jest.fn().mockResolvedValue(mockArticle);

      const result = await articlesService.create('user-123', {
        title: 'Test Article',
        content: 'This is test content',
      });

      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Test Article');
    });

    it('should create article with tags', async () => {
      prismaService.article.create = jest.fn().mockResolvedValue({
        ...mockArticle,
        tags: [{ tag: { name: 'react' } }],
      });

      const result = await articlesService.create('user-123', {
        title: 'Test Article',
        content: 'Content',
        tags: ['react'],
      });

      expect(result.success).toBe(true);
      expect(result.data.tags).toContain('react');
    });
  });

  describe('findAll', () => {
    it('should return paginated articles', async () => {
      prismaService.article.findMany = jest.fn().mockResolvedValue([mockArticle]);
      prismaService.article.count = jest.fn().mockResolvedValue(1);

      const result = await articlesService.findAll({ page: 1, limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(1);
      expect(result.data.total).toBe(1);
      expect(result.data.page).toBe(1);
      expect(result.data.totalPages).toBe(1);
    });

    it('should filter by authorId', async () => {
      prismaService.article.findMany = jest.fn().mockResolvedValue([mockArticle]);
      prismaService.article.count = jest.fn().mockResolvedValue(1);

      await articlesService.findAll({ page: 1, limit: 20, authorId: 'user-123' });

      expect(prismaService.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ authorId: 'user-123' }),
        })
      );
    });

    it('should search by title or content', async () => {
      prismaService.article.findMany = jest.fn().mockResolvedValue([mockArticle]);
      prismaService.article.count = jest.fn().mockResolvedValue(1);

      await articlesService.findAll({ page: 1, limit: 20, search: 'test' });

      expect(prismaService.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      );
    });

    it('should return empty list when no articles', async () => {
      prismaService.article.findMany = jest.fn().mockResolvedValue([]);
      prismaService.article.count = jest.fn().mockResolvedValue(0);

      const result = await articlesService.findAll({ page: 1, limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(0);
      expect(result.data.total).toBe(0);
    });
  });

  describe('findBySlug', () => {
    it('should return article by slug', async () => {
      prismaService.article.findUnique = jest.fn().mockResolvedValue(mockArticle);
      prismaService.article.update = jest.fn().mockResolvedValue({
        ...mockArticle,
        readCount: 1,
      });

      const result = await articlesService.findBySlug('test-article-abc123');

      expect(result.success).toBe(true);
      expect(result.data.slug).toBe('test-article-abc123');
      // readCount increment is fire-and-forget - response uses original article data
      expect(result.data.readCount).toBe(0);
    });

    it('should throw NotFoundException if article not found', async () => {
      prismaService.article.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        articlesService.findBySlug('nonexistent-slug')
      ).rejects.toThrow(NotFoundException);
    });

    it('should include isLiked when userId provided', async () => {
      prismaService.article.findUnique = jest.fn().mockResolvedValue({
        ...mockArticle,
        likes: [{ userId: 'user-123' }],
      });
      prismaService.article.update = jest.fn().mockResolvedValue(mockArticle);

      const result = await articlesService.findBySlug('test-article', 'user-123');

      expect(result.data.isLiked).toBe(true);
    });
  });

  describe('update', () => {
    it('should update article by author', async () => {
      prismaService.article.findUnique = jest.fn().mockResolvedValue(mockArticle);
      prismaService.article.update = jest.fn().mockResolvedValue({
        ...mockArticle,
        title: 'Updated Title',
      });

      const result = await articlesService.update(
        'test-article-abc123',
        'user-123',
        { title: 'Updated Title' }
      );

      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Updated Title');
    });

    it('should throw NotFoundException if article not found', async () => {
      prismaService.article.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        articlesService.update('nonexistent', 'user-123', { title: 'New' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not author', async () => {
      prismaService.article.findUnique = jest.fn().mockResolvedValue(mockArticle);

      await expect(
        articlesService.update('test-article', 'other-user', { title: 'Hack' })
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should delete article by author', async () => {
      prismaService.article.findUnique = jest.fn().mockResolvedValue(mockArticle);
      prismaService.article.delete = jest.fn().mockResolvedValue(mockArticle);

      const result = await articlesService.delete('test-article-abc123', 'user-123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Article deleted');
    });

    it('should throw ForbiddenException if not author', async () => {
      prismaService.article.findUnique = jest.fn().mockResolvedValue(mockArticle);

      await expect(
        articlesService.delete('test-article', 'other-user')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('like', () => {
    it('should like an article', async () => {
      prismaService.article.findUnique = jest.fn().mockResolvedValue(mockArticle);
      prismaService.like.findUnique = jest.fn().mockResolvedValue(null);
      prismaService.like.create = jest.fn().mockResolvedValue({});
      prismaService.article.update = jest.fn().mockResolvedValue({
        ...mockArticle,
        likeCount: 1,
      });

      const result = await articlesService.like('test-article', 'user-123');

      expect(result.success).toBe(true);
      expect(result.data.isLiked).toBe(true);
      expect(result.data.likeCount).toBe(1);
    });

    it('should unlike if already liked', async () => {
      prismaService.article.findUnique = jest.fn().mockResolvedValue({
        ...mockArticle,
        likeCount: 5,
      });
      prismaService.like.findUnique = jest.fn().mockResolvedValue({ userId: 'user-123' });
      prismaService.like.delete = jest.fn().mockResolvedValue({});
      prismaService.article.update = jest.fn().mockResolvedValue({
        ...mockArticle,
        likeCount: 4,
      });

      const result = await articlesService.like('test-article', 'user-123');

      expect(result.success).toBe(true);
      expect(result.data.isLiked).toBe(false);
      expect(result.data.likeCount).toBe(4);
    });

    it('should throw NotFoundException if article not found', async () => {
      prismaService.article.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        articlesService.like('nonexistent', 'user-123')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('bookmark', () => {
    it('should bookmark an article', async () => {
      prismaService.article.findUnique = jest.fn().mockResolvedValue(mockArticle);
      prismaService.bookmark.findUnique = jest.fn().mockResolvedValue(null);
      prismaService.bookmark.create = jest.fn().mockResolvedValue({});

      const result = await articlesService.bookmark('test-article', 'user-123');

      expect(result.success).toBe(true);
      expect(result.data.isBookmarked).toBe(true);
    });

    it('should unbookmark if already bookmarked', async () => {
      prismaService.article.findUnique = jest.fn().mockResolvedValue(mockArticle);
      prismaService.bookmark.findUnique = jest.fn().mockResolvedValue({
        userId: 'user-123',
        articleId: 'article-123',
      });
      prismaService.bookmark.delete = jest.fn().mockResolvedValue({});

      const result = await articlesService.bookmark('test-article', 'user-123');

      expect(result.success).toBe(true);
      expect(result.data.isBookmarked).toBe(false);
    });

    it('should throw NotFoundException if article not found', async () => {
      prismaService.article.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        articlesService.bookmark('nonexistent', 'user-123')
      ).rejects.toThrow(NotFoundException);
    });
  });
});

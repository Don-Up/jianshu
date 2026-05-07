import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CommentsService } from '../comments.service';
import { PrismaService } from '../../prisma.service';

describe('CommentsService', () => {
  let commentsService: CommentsService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUser = {
    id: 'user-123',
    username: 'testuser',
    name: 'Test User',
    avatar: null,
    email: 'test@example.com',
    password: 'hashed',
    bio: null,
    createdAt: new Date(),
    updatedAt: new Date(),
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
  };

  const mockComment = {
    id: 'comment-123',
    content: 'This is a test comment',
    createdAt: new Date(),
    updatedAt: new Date(),
    authorId: 'user-123',
    articleId: 'article-123',
    author: {
      id: 'user-123',
      username: 'testuser',
      name: 'Test User',
      avatar: null,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: PrismaService,
          useValue: {
            article: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            comment: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    commentsService = module.get<CommentsService>(CommentsService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a comment and increment article commentCount', async () => {
      prismaService.article.findUnique = jest.fn().mockResolvedValue(mockArticle);
      prismaService.comment.create = jest.fn().mockResolvedValue(mockComment);
      prismaService.article.update = jest.fn().mockResolvedValue({
        ...mockArticle,
        commentCount: 1,
      });

      const result = await commentsService.create('article-123', 'user-123', {
        content: 'This is a test comment',
      });

      expect(result.success).toBe(true);
      expect(result.data.content).toBe('This is a test comment');
      expect(result.data.author.username).toBe('testuser');
      expect(prismaService.article.update).toHaveBeenCalledWith({
        where: { id: 'article-123' },
        data: { commentCount: { increment: 1 } },
      });
    });

    it('should throw NotFoundException if article not found', async () => {
      prismaService.article.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        commentsService.create('nonexistent', 'user-123', {
          content: 'Test comment',
        })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByArticle', () => {
    it('should return paginated comments for an article', async () => {
      prismaService.comment.findMany = jest.fn().mockResolvedValue([mockComment]);
      prismaService.comment.count = jest.fn().mockResolvedValue(1);

      const result = await commentsService.findByArticle('article-123', {
        page: 1,
        limit: 20,
      });

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].content).toBe('This is a test comment');
      expect(result.data.total).toBe(1);
      expect(result.data.page).toBe(1);
      expect(result.data.totalPages).toBe(1);
    });

    it('should return empty list when no comments', async () => {
      prismaService.comment.findMany = jest.fn().mockResolvedValue([]);
      prismaService.comment.count = jest.fn().mockResolvedValue(0);

      const result = await commentsService.findByArticle('article-123', {
        page: 1,
        limit: 20,
      });

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(0);
      expect(result.data.total).toBe(0);
    });

    it('should use default pagination values', async () => {
      prismaService.comment.findMany = jest.fn().mockResolvedValue([]);
      prismaService.comment.count = jest.fn().mockResolvedValue(0);

      await commentsService.findByArticle('article-123', {});

      expect(prismaService.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should calculate correct pagination', async () => {
      prismaService.comment.findMany = jest.fn().mockResolvedValue([mockComment]);
      prismaService.comment.count = jest.fn().mockResolvedValue(45);

      const result = await commentsService.findByArticle('article-123', {
        page: 2,
        limit: 20,
      });

      expect(result.data.totalPages).toBe(3);
      expect(prismaService.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        })
      );
    });
  });

  describe('delete', () => {
    it('should delete a comment and decrement article commentCount', async () => {
      prismaService.comment.findUnique = jest.fn().mockResolvedValue(mockComment);
      prismaService.comment.delete = jest.fn().mockResolvedValue(mockComment);
      prismaService.article.update = jest.fn().mockResolvedValue({
        ...mockArticle,
        commentCount: 0,
      });

      const result = await commentsService.delete('comment-123', 'user-123');

      expect(result.success).toBe(true);
      expect(prismaService.comment.delete).toHaveBeenCalledWith({
        where: { id: 'comment-123' },
      });
      expect(prismaService.article.update).toHaveBeenCalledWith({
        where: { id: 'article-123' },
        data: { commentCount: { decrement: 1 } },
      });
    });

    it('should throw NotFoundException if comment not found', async () => {
      prismaService.comment.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        commentsService.delete('nonexistent', 'user-123')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the author', async () => {
      prismaService.comment.findUnique = jest.fn().mockResolvedValue(mockComment);

      await expect(
        commentsService.delete('comment-123', 'other-user')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should not delete comment if not the author', async () => {
      prismaService.comment.findUnique = jest.fn().mockResolvedValue(mockComment);

      await expect(
        commentsService.delete('comment-123', 'different-user')
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
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
    parentId: null,
    author: {
      id: 'user-123',
      username: 'testuser',
      name: 'Test User',
      avatar: null,
    },
    likes: [],
    _count: { likes: 0 },
  };

  const mockReply = {
    id: 'reply-123',
    content: 'This is a reply',
    createdAt: new Date(),
    updatedAt: new Date(),
    authorId: 'user-456',
    articleId: 'article-123',
    parentId: 'comment-123',
    author: {
      id: 'user-456',
      username: 'otheruser',
      name: 'Other User',
      avatar: null,
    },
    likes: [],
    _count: { likes: 1 },
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
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            commentLike: {
              create: jest.fn(),
              delete: jest.fn(),
              findUnique: jest.fn(),
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
    it('should create a top-level comment and increment article commentCount', async () => {
      prismaService.article.findUnique = jest.fn().mockResolvedValue(mockArticle);
      prismaService.comment.create = jest.fn().mockResolvedValue(mockComment);
      prismaService.article.update = jest.fn().mockResolvedValue({
        ...mockArticle,
        commentCount: 1,
      });

      const result = await commentsService.create('test-article-abc123', 'user-123', {
        content: 'This is a test comment',
      });

      expect(result.success).toBe(true);
      expect(result.data.content).toBe('This is a test comment');
      expect(result.data.author.username).toBe('testuser');
      expect(result.data.parentId).toBeNull();
      expect(prismaService.article.update).toHaveBeenCalledWith({
        where: { id: 'article-123' },
        data: { commentCount: { increment: 1 } },
      });
    });

    it('should create a reply without incrementing article commentCount', async () => {
      prismaService.article.findUnique = jest.fn().mockResolvedValue(mockArticle);
      prismaService.comment.findUnique = jest.fn().mockResolvedValue(mockComment);
      prismaService.comment.create = jest.fn().mockResolvedValue(mockReply);
      // article.update should NOT be called for replies

      const result = await commentsService.create('test-article-abc123', 'user-456', {
        content: 'This is a reply',
        parentId: 'comment-123',
      });

      expect(result.success).toBe(true);
      expect(result.data.parentId).toBe('comment-123');
      expect(prismaService.article.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if article not found', async () => {
      prismaService.article.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        commentsService.create('nonexistent-slug', 'user-123', {
          content: 'Test comment',
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if parent comment not found', async () => {
      prismaService.article.findUnique = jest.fn().mockResolvedValue(mockArticle);
      prismaService.comment.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        commentsService.create('test-article-abc123', 'user-123', {
          content: 'Test reply',
          parentId: 'nonexistent-parent',
        })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByArticle', () => {
    it('should return nested comment tree', async () => {
      prismaService.article.findUnique = jest.fn().mockResolvedValue(mockArticle);
      prismaService.comment.findMany = jest.fn().mockResolvedValue([mockComment, mockReply]);

      const result = await commentsService.findByArticle('test-article-abc123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('comment-123');
      expect(result.data[0].replies).toHaveLength(1);
      expect(result.data[0].replies[0].id).toBe('reply-123');
    });

    it('should include isLiked status when userId provided', async () => {
      prismaService.article.findUnique = jest.fn().mockResolvedValue(mockArticle);
      prismaService.comment.findMany = jest.fn().mockResolvedValue([mockComment]);
      // No likes relation when userId not passed

      const result = await commentsService.findByArticle('test-article-abc123', 'user-123');

      expect(result.success).toBe(true);
      expect(result.data[0].isLiked).toBe(false);
    });

    it('should throw NotFoundException if article not found', async () => {
      prismaService.article.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        commentsService.findByArticle('nonexistent-slug')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should soft delete comment with replies', async () => {
      prismaService.comment.findUnique = jest.fn().mockResolvedValue({
        ...mockComment,
        _count: { replies: 1 },
      });
      prismaService.comment.update = jest.fn().mockResolvedValue({
        ...mockComment,
        content: '[已删除]',
      });

      const result = await commentsService.delete('comment-123', 'user-123');

      expect(result.success).toBe(true);
      expect(prismaService.comment.update).toHaveBeenCalledWith({
        where: { id: 'comment-123' },
        data: { content: '[已删除]' },
      });
      expect(prismaService.comment.delete).not.toHaveBeenCalled();
    });

    it('should hard delete comment without replies and decrement count', async () => {
      prismaService.comment.findUnique = jest.fn().mockResolvedValue({
        ...mockComment,
        _count: { replies: 0 },
      });
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
      expect(prismaService.article.update).toHaveBeenCalled();
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
  });

  describe('likeComment', () => {
    it('should create like and return new count', async () => {
      prismaService.comment.findUnique = jest.fn().mockResolvedValue(mockComment);
      prismaService.commentLike.findUnique = jest.fn().mockResolvedValue(null);
      prismaService.commentLike.create = jest.fn().mockResolvedValue({ id: 'like-1' });
      prismaService.commentLike.count = jest.fn().mockResolvedValue(1);

      const result = await commentsService.likeComment('comment-123', 'user-123');

      expect(result.success).toBe(true);
      expect(result.data.likeCount).toBe(1);
    });

    it('should throw BadRequestException if already liked', async () => {
      prismaService.comment.findUnique = jest.fn().mockResolvedValue(mockComment);
      prismaService.commentLike.findUnique = jest.fn().mockResolvedValue({ id: 'like-1' });

      await expect(
        commentsService.likeComment('comment-123', 'user-123')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if comment not found', async () => {
      prismaService.comment.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        commentsService.likeComment('nonexistent', 'user-123')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('unlikeComment', () => {
    it('should delete like and return new count', async () => {
      prismaService.comment.findUnique = jest.fn().mockResolvedValue(mockComment);
      prismaService.commentLike.findUnique = jest.fn().mockResolvedValue({ id: 'like-1' });
      prismaService.commentLike.delete = jest.fn().mockResolvedValue({ id: 'like-1' });
      prismaService.commentLike.count = jest.fn().mockResolvedValue(0);

      const result = await commentsService.unlikeComment('comment-123', 'user-123');

      expect(result.success).toBe(true);
      expect(result.data.likeCount).toBe(0);
    });

    it('should throw BadRequestException if not liked yet', async () => {
      prismaService.comment.findUnique = jest.fn().mockResolvedValue(mockComment);
      prismaService.commentLike.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        commentsService.unlikeComment('comment-123', 'user-123')
      ).rejects.toThrow(BadRequestException);
    });
  });
});

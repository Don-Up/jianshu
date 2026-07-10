import { Test, TestingModule } from '@nestjs/testing';
import { FeedService } from '../feed.service';
import { PrismaService } from '../../prisma.service';

describe('FeedService', () => {
  let feedService: FeedService;
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
    likeCount: 10,
    commentCount: 0,
    readCount: 0,
    published: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    authorId: 'user-456',
    author: {
      id: 'user-456',
      username: 'author',
      name: 'Author User',
      avatar: null,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        {
          provide: PrismaService,
          useValue: {
            article: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
            readingHistory: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    feedService = module.get<FeedService>(FeedService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHomeFeed', () => {
    it('should return articles from followed users', async () => {
      prismaService.article.findMany = jest.fn().mockResolvedValue([mockArticle]);
      prismaService.article.count = jest.fn().mockResolvedValue(1);

      const result = await feedService.getHomeFeed('user-123', { page: 1, limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].title).toBe('Test Article');
      expect(result.data.total).toBe(1);
    });

    it('should use default pagination values', async () => {
      prismaService.article.findMany = jest.fn().mockResolvedValue([]);
      prismaService.article.count = jest.fn().mockResolvedValue(0);

      const result = await feedService.getHomeFeed('user-123', {});

      expect(result.success).toBe(true);
      expect(prismaService.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        })
      );
    });

    it('should order by createdAt descending', async () => {
      prismaService.article.findMany = jest.fn().mockResolvedValue([]);
      prismaService.article.count = jest.fn().mockResolvedValue(0);

      await feedService.getHomeFeed('user-123', { page: 1, limit: 20 });

      expect(prismaService.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should only return published articles', async () => {
      prismaService.article.findMany = jest.fn().mockResolvedValue([]);
      prismaService.article.count = jest.fn().mockResolvedValue(0);

      await feedService.getHomeFeed('user-123', { page: 1, limit: 20 });

      expect(prismaService.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            published: true,
          }),
        })
      );
    });
  });

  describe('getRecommendedFeed', () => {
    it('should return articles sorted by likeCount', async () => {
      const highLikesArticle = { ...mockArticle, likeCount: 100 };
      prismaService.readingHistory.findMany = jest.fn().mockResolvedValue([]);
      prismaService.article.findMany = jest.fn().mockResolvedValue([highLikesArticle]);
      prismaService.article.count = jest.fn().mockResolvedValue(1);

      const result = await feedService.getRecommendedFeed('user-123', { page: 1, limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data.items[0].likeCount).toBe(100);
    });

    it('should exclude already read articles', async () => {
      prismaService.readingHistory.findMany = jest.fn().mockResolvedValue([
        { articleId: 'article-read' },
      ]);
      prismaService.article.findMany = jest.fn().mockResolvedValue([]);
      prismaService.article.count = jest.fn().mockResolvedValue(0);

      await feedService.getRecommendedFeed('user-123', { page: 1, limit: 20 });

      expect(prismaService.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            NOT: expect.objectContaining({
              id: { in: ['article-read'] },
            }),
          }),
        })
      );
    });

    it('should order by likeCount desc then createdAt desc', async () => {
      prismaService.readingHistory.findMany = jest.fn().mockResolvedValue([]);
      prismaService.article.findMany = jest.fn().mockResolvedValue([]);
      prismaService.article.count = jest.fn().mockResolvedValue(0);

      await feedService.getRecommendedFeed('user-123', { page: 1, limit: 20 });

      expect(prismaService.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [
            { likeCount: 'desc' },
            { createdAt: 'desc' },
          ],
        })
      );
    });
  });
});

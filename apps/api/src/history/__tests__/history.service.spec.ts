import { Test, TestingModule } from '@nestjs/testing';
import { HistoryService } from '../history.service';
import { PrismaService } from '../../prisma.service';

describe('HistoryService', () => {
  let historyService: HistoryService;
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

  const mockHistoryItem = {
    id: 'history-123',
    userId: 'user-123',
    articleId: 'article-123',
    viewedAt: new Date(),
    article: mockArticle,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoryService,
        {
          provide: PrismaService,
          useValue: {
            article: {
              findUnique: jest.fn(),
            },
            readingHistory: {
              upsert: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    historyService = module.get<HistoryService>(HistoryService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('recordView', () => {
    it('should record article view with upsert', async () => {
      prismaService.article.findUnique = jest.fn().mockResolvedValue(mockArticle);
      prismaService.readingHistory.upsert = jest.fn().mockResolvedValue(mockHistoryItem);

      const result = await historyService.recordView('user-123', 'test-article-abc123');

      expect(result.success).toBe(true);
      expect(prismaService.readingHistory.upsert).toHaveBeenCalledWith({
        where: {
          userId_articleId: {
            userId: 'user-123',
            articleId: 'article-123',
          },
        },
        update: {
          viewedAt: expect.any(Date),
        },
        create: {
          userId: 'user-123',
          articleId: 'article-123',
        },
      });
    });

    it('should return failure if article not found', async () => {
      prismaService.article.findUnique = jest.fn().mockResolvedValue(null);

      const result = await historyService.recordView('user-123', 'nonexistent-slug');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Article not found');
    });
  });

  describe('getHistory', () => {
    it('should return paginated reading history', async () => {
      prismaService.readingHistory.findMany = jest.fn().mockResolvedValue([mockHistoryItem]);
      prismaService.readingHistory.count = jest.fn().mockResolvedValue(1);

      const result = await historyService.getHistory('user-123', { page: 1, limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].article.title).toBe('Test Article');
      expect(result.data.total).toBe(1);
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.totalPages).toBe(1);
    });

    it('should use default pagination values', async () => {
      prismaService.readingHistory.findMany = jest.fn().mockResolvedValue([]);
      prismaService.readingHistory.count = jest.fn().mockResolvedValue(0);

      const result = await historyService.getHistory('user-123', {});

      expect(result.success).toBe(true);
      expect(prismaService.readingHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        })
      );
    });

    it('should order by viewedAt descending', async () => {
      prismaService.readingHistory.findMany = jest.fn().mockResolvedValue([]);
      prismaService.readingHistory.count = jest.fn().mockResolvedValue(0);

      await historyService.getHistory('user-123', { page: 1, limit: 20 });

      expect(prismaService.readingHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { viewedAt: 'desc' },
        })
      );
    });
  });

  describe('removeFromHistory', () => {
    it('should remove article from history', async () => {
      prismaService.readingHistory.deleteMany = jest.fn().mockResolvedValue({ count: 1 });

      const result = await historyService.removeFromHistory('user-123', 'article-123');

      expect(result.success).toBe(true);
      expect(prismaService.readingHistory.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          articleId: 'article-123',
        },
      });
    });
  });

  describe('clearHistory', () => {
    it('should clear all reading history for user', async () => {
      prismaService.readingHistory.deleteMany = jest.fn().mockResolvedValue({ count: 5 });

      const result = await historyService.clearHistory('user-123');

      expect(result.success).toBe(true);
      expect(prismaService.readingHistory.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });
  });
});

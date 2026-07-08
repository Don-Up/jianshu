import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AnalyticsService } from '../analytics.service';
import { PrismaService } from '../../prisma.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prismaService: any;

  const mockArticle = {
    id: 'article-123',
    title: 'Test Article',
    slug: 'test-article-abc123',
    likeCount: 10,
    commentCount: 5,
    readCount: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
    shares: [
      { platform: 'twitter' },
      { platform: 'twitter' },
      { platform: 'wechat' },
    ],
    author: { id: 'user-123', username: 'testuser', name: 'Test User' },
  };

  const mockUser = {
    id: 'user-123',
    username: 'testuser',
    articles: [
      { id: 'a1', likeCount: 10, commentCount: 5, readCount: 100 },
      { id: 'a2', likeCount: 20, commentCount: 10, readCount: 200 },
    ],
    followers: [{ id: 'f1' }, { id: 'f2' }],
    following: [{ id: 'f3' }],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: {
            article: { findUnique: jest.fn() },
            user: { findUnique: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getArticleAnalytics', () => {
    it('should return article analytics', async () => {
      prismaService.article.findUnique.mockResolvedValue(mockArticle);

      const result = await service.getArticleAnalytics('test-article-abc123');

      expect(result.success).toBe(true);
      expect(result.data.stats.likes).toBe(10);
      expect(result.data.stats.comments).toBe(5);
      expect(result.data.stats.reads).toBe(100);
      expect(result.data.stats.shares).toBe(3);
      expect(result.data.stats.sharesByPlatform).toEqual({ twitter: 2, wechat: 1 });
    });

    it('should throw NotFoundException when article not found', async () => {
      prismaService.article.findUnique.mockResolvedValue(null);

      await expect(service.getArticleAnalytics('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserAnalytics', () => {
    it('should return user analytics', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUserAnalytics('testuser');

      expect(result.success).toBe(true);
      expect(result.data.stats.articlesCount).toBe(2);
      expect(result.data.stats.totalLikes).toBe(30);
      expect(result.data.stats.totalComments).toBe(15);
      expect(result.data.stats.totalReads).toBe(300);
      expect(result.data.stats.followersCount).toBe(2);
      expect(result.data.stats.followingCount).toBe(1);
    });

    it('should throw NotFoundException when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserAnalytics('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});

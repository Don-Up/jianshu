import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ShareService } from '../share.service';
import { PrismaService } from '../../prisma.service';

describe('ShareService', () => {
  let service: ShareService;
  let prismaService: any;

  const mockArticle = {
    id: 'article-123',
    title: 'Test Article',
    slug: 'test-article-abc123',
    content: 'Test content',
    excerpt: 'Excerpt',
    coverImage: null,
    likeCount: 0,
    commentCount: 0,
    readCount: 0,
    published: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    authorId: 'user-123',
  };

  const mockShare = {
    id: 'share-123',
    platform: 'twitter',
    articleId: 'article-123',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShareService,
        {
          provide: PrismaService,
          useValue: {
            article: {
              findUnique: jest.fn(),
            },
            share: {
              create: jest.fn(),
              groupBy: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ShareService>(ShareService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a share record', async () => {
      prismaService.article.findUnique.mockResolvedValue(mockArticle);
      prismaService.share.create.mockResolvedValue(mockShare);

      const result = await service.create('test-article-abc123', 'twitter');

      expect(result.success).toBe(true);
      expect(result.data.platform).toBe('twitter');
      expect(prismaService.share.create).toHaveBeenCalledWith({
        data: {
          articleId: 'article-123',
          platform: 'twitter',
        },
      });
    });

    it('should throw NotFoundException when article not found', async () => {
      prismaService.article.findUnique.mockResolvedValue(null);

      await expect(service.create('nonexistent-slug', 'twitter')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getShares', () => {
    it('should return share counts grouped by platform', async () => {
      prismaService.article.findUnique.mockResolvedValue(mockArticle);
      prismaService.share.groupBy.mockResolvedValue([
        { platform: 'twitter', _count: 5 },
        { platform: 'wechat', _count: 3 },
      ]);
      prismaService.share.count.mockResolvedValue(8);

      const result = await service.getShares('test-article-abc123');

      expect(result.success).toBe(true);
      expect(result.data.total).toBe(8);
      expect(result.data.byPlatform).toEqual({ twitter: 5, wechat: 3 });
    });

    it('should return empty counts when no shares', async () => {
      prismaService.article.findUnique.mockResolvedValue(mockArticle);
      prismaService.share.groupBy.mockResolvedValue([]);
      prismaService.share.count.mockResolvedValue(0);

      const result = await service.getShares('test-article-abc123');

      expect(result.success).toBe(true);
      expect(result.data.total).toBe(0);
      expect(result.data.byPlatform).toEqual({});
    });

    it('should throw NotFoundException when article not found', async () => {
      prismaService.article.findUnique.mockResolvedValue(null);

      await expect(service.getShares('nonexistent-slug')).rejects.toThrow(NotFoundException);
    });
  });
});

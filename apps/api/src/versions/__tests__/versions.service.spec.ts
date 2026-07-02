import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { VersionsService } from '../versions.service';
import { PrismaService } from '../../prisma.service';

describe('VersionsService', () => {
  let service: VersionsService;
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

  const mockVersion = {
    id: 'version-123',
    title: 'Previous Title',
    content: 'Previous content',
    excerpt: 'Previous excerpt',
    version: 1,
    createdAt: new Date(),
    articleId: 'article-123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VersionsService,
        {
          provide: PrismaService,
          useValue: {
            article: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            articleVersion: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<VersionsService>(VersionsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all versions for an article', async () => {
      prismaService.article.findUnique.mockResolvedValue(mockArticle);
      prismaService.articleVersion.findMany.mockResolvedValue([
        { ...mockVersion, version: 2 },
        mockVersion,
      ]);

      const result = await service.findAll('test-article-abc123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(prismaService.articleVersion.findMany).toHaveBeenCalledWith({
        where: { articleId: 'article-123' },
        orderBy: { version: 'desc' },
      });
    });

    it('should throw NotFoundException when article not found', async () => {
      prismaService.article.findUnique.mockResolvedValue(null);

      await expect(service.findAll('nonexistent-slug')).rejects.toThrow(NotFoundException);
    });

    it('should return empty array when no versions exist', async () => {
      prismaService.article.findUnique.mockResolvedValue(mockArticle);
      prismaService.articleVersion.findMany.mockResolvedValue([]);

      const result = await service.findAll('test-article-abc123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return specific version', async () => {
      prismaService.article.findUnique.mockResolvedValue(mockArticle);
      prismaService.articleVersion.findUnique.mockResolvedValue(mockVersion);

      const result = await service.findOne('test-article-abc123', 'version-123');

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('version-123');
      expect(result.data.title).toBe('Previous Title');
    });

    it('should throw NotFoundException when article not found', async () => {
      prismaService.article.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-slug', 'version-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when version not found', async () => {
      prismaService.article.findUnique.mockResolvedValue(mockArticle);
      prismaService.articleVersion.findUnique.mockResolvedValue(null);

      await expect(service.findOne('test-article-abc123', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when version belongs to different article', async () => {
      prismaService.article.findUnique.mockResolvedValue(mockArticle);
      prismaService.articleVersion.findUnique.mockResolvedValue({
        ...mockVersion,
        articleId: 'different-article',
      });

      await expect(service.findOne('test-article-abc123', 'version-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('restore', () => {
    it('should restore article to previous version', async () => {
      prismaService.article.findUnique.mockResolvedValue(mockArticle);
      prismaService.articleVersion.findUnique.mockResolvedValue(mockVersion);
      prismaService.articleVersion.findFirst.mockResolvedValue({ version: 1 });
      prismaService.articleVersion.create.mockResolvedValue({ ...mockVersion, version: 2 });
      prismaService.article.update.mockResolvedValue({
        ...mockArticle,
        title: mockVersion.title,
        content: mockVersion.content,
        excerpt: mockVersion.excerpt,
      });

      const result = await service.restore('test-article-abc123', 'version-123', 'user-123');

      expect(result.success).toBe(true);
      // Check data and where, not the full object (actual call includes 'include')
      const updateCall = prismaService.article.update.mock.calls[0][0];
      expect(updateCall.where).toEqual({ id: 'article-123' });
      expect(updateCall.data).toEqual({
        title: mockVersion.title,
        content: mockVersion.content,
        excerpt: mockVersion.excerpt,
      });
    });

    it('should save current version before restoring', async () => {
      prismaService.article.findUnique.mockResolvedValue(mockArticle);
      prismaService.articleVersion.findUnique.mockResolvedValue(mockVersion);
      prismaService.articleVersion.findFirst.mockResolvedValue({ version: 1 });
      prismaService.articleVersion.create.mockResolvedValue({ ...mockVersion, version: 2 });
      prismaService.article.update.mockResolvedValue({
        ...mockArticle,
        title: mockVersion.title,
        content: mockVersion.content,
      });

      await service.restore('test-article-abc123', 'version-123', 'user-123');

      // Should create a snapshot of current state before restoring
      expect(prismaService.articleVersion.create).toHaveBeenCalledWith({
        data: {
          articleId: 'article-123',
          title: mockArticle.title,
          content: mockArticle.content,
          excerpt: mockArticle.excerpt,
          version: 2, // Current version + 1
        },
      });
    });

    it('should throw NotFoundException when article not found', async () => {
      prismaService.article.findUnique.mockResolvedValue(null);

      await expect(
        service.restore('nonexistent-slug', 'version-123', 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user is not the author', async () => {
      prismaService.article.findUnique.mockResolvedValue(mockArticle);

      await expect(
        service.restore('test-article-abc123', 'version-123', 'other-user'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when version not found', async () => {
      prismaService.article.findUnique.mockResolvedValue(mockArticle);
      prismaService.articleVersion.findUnique.mockResolvedValue(null);

      await expect(
        service.restore('test-article-abc123', 'nonexistent', 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('saveVersion', () => {
    it('should create a version snapshot', async () => {
      prismaService.articleVersion.create.mockResolvedValue({
        ...mockVersion,
        version: 3,
      });

      const result = await service.saveVersion('article-123', {
        title: 'New Title',
        content: 'New content',
        excerpt: 'New excerpt',
      }, 3);

      expect(prismaService.articleVersion.create).toHaveBeenCalledWith({
        data: {
          articleId: 'article-123',
          title: 'New Title',
          content: 'New content',
          excerpt: 'New excerpt',
          version: 3,
        },
      });
    });
  });

  describe('getLatestVersionNumber', () => {
    it('should return latest version number', async () => {
      prismaService.articleVersion.findFirst.mockResolvedValue({ version: 5 });

      const result = await service.getLatestVersionNumber('article-123');

      expect(result).toBe(5);
      expect(prismaService.articleVersion.findFirst).toHaveBeenCalledWith({
        where: { articleId: 'article-123' },
        orderBy: { version: 'desc' },
      });
    });

    it('should return 0 when no versions exist', async () => {
      prismaService.articleVersion.findFirst.mockResolvedValue(null);

      const result = await service.getLatestVersionNumber('article-123');

      expect(result).toBe(0);
    });
  });
});

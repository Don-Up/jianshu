import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DraftsService } from '../drafts.service';
import { PrismaService } from '../../prisma.service';

describe('DraftsService', () => {
  let draftsService: DraftsService;
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

  const mockDraft = {
    id: 'article-123',
    title: 'Draft Article',
    slug: 'draft-article-abc123',
    content: 'Draft content',
    excerpt: 'Draft excerpt',
    coverImage: null,
    likeCount: 0,
    commentCount: 0,
    readCount: 0,
    published: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    authorId: 'user-123',
    author: {
      id: 'user-123',
      username: 'testuser',
      name: 'Test User',
      avatar: null,
    },
    tags: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DraftsService,
        {
          provide: PrismaService,
          useValue: {
            article: {
              create: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    draftsService = module.get<DraftsService>(DraftsService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a draft with published=false', async () => {
      prismaService.article.create = jest.fn().mockResolvedValue(mockDraft);

      const result = await draftsService.create('user-123', {
        title: 'Draft Article',
        content: 'Draft content',
      });

      expect(result.success).toBe(true);
      expect(result.data.published).toBe(false);
      expect(prismaService.article.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            published: false,
          }),
        })
      );
    });
  });

  describe('findAll', () => {
    it('should return only unpublished articles', async () => {
      prismaService.article.findMany = jest.fn().mockResolvedValue([mockDraft]);
      prismaService.article.count = jest.fn().mockResolvedValue(1);

      const result = await draftsService.findAll('user-123', { page: 1, limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(1);
      expect(prismaService.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            published: false,
            authorId: 'user-123',
          }),
        })
      );
    });

    it('should order by updatedAt descending', async () => {
      prismaService.article.findMany = jest.fn().mockResolvedValue([]);
      prismaService.article.count = jest.fn().mockResolvedValue(0);

      await draftsService.findAll('user-123', { page: 1, limit: 20 });

      expect(prismaService.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { updatedAt: 'desc' },
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return draft by slug', async () => {
      prismaService.article.findFirst = jest.fn().mockResolvedValue(mockDraft);

      const result = await draftsService.findOne('user-123', 'draft-article-abc123');

      expect(result.success).toBe(true);
      expect(result.data.slug).toBe('draft-article-abc123');
    });

    it('should throw NotFoundException if draft not found', async () => {
      prismaService.article.findFirst = jest.fn().mockResolvedValue(null);

      await expect(
        draftsService.findOne('user-123', 'nonexistent-slug')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update draft content', async () => {
      prismaService.article.findFirst = jest.fn().mockResolvedValue(mockDraft);
      prismaService.article.update = jest.fn().mockResolvedValue({
        ...mockDraft,
        title: 'Updated Title',
      });

      const result = await draftsService.update('user-123', 'draft-article-abc123', {
        title: 'Updated Title',
      });

      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Updated Title');
    });

    it('should throw NotFoundException if draft not found', async () => {
      prismaService.article.findFirst = jest.fn().mockResolvedValue(null);

      await expect(
        draftsService.update('user-123', 'nonexistent-slug', { title: 'New' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete draft', async () => {
      prismaService.article.findFirst = jest.fn().mockResolvedValue(mockDraft);
      prismaService.article.delete = jest.fn().mockResolvedValue(mockDraft);

      const result = await draftsService.delete('user-123', 'draft-article-abc123');

      expect(result.success).toBe(true);
      expect(prismaService.article.delete).toHaveBeenCalledWith({
        where: { id: 'article-123' },
      });
    });

    it('should throw NotFoundException if draft not found', async () => {
      prismaService.article.findFirst = jest.fn().mockResolvedValue(null);

      await expect(
        draftsService.delete('user-123', 'nonexistent-slug')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('publish', () => {
    it('should set published=true', async () => {
      prismaService.article.findFirst = jest.fn().mockResolvedValue(mockDraft);
      prismaService.article.update = jest.fn().mockResolvedValue({
        ...mockDraft,
        published: true,
      });

      const result = await draftsService.publish('user-123', 'draft-article-abc123');

      expect(result.success).toBe(true);
      expect(result.data.published).toBe(true);
      expect(prismaService.article.update).toHaveBeenCalledWith({
        where: { id: 'article-123' },
        data: { published: true },
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
    });

    it('should throw NotFoundException if draft not found', async () => {
      prismaService.article.findFirst = jest.fn().mockResolvedValue(null);

      await expect(
        draftsService.publish('user-123', 'nonexistent-slug')
      ).rejects.toThrow(NotFoundException);
    });
  });
});

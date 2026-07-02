import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CollectionsService } from '../collections.service';
import { PrismaService } from '../../prisma.service';

describe('CollectionsService', () => {
  let service: CollectionsService;
  let prismaService: any;

  const mockCollection = {
    id: 'col-123',
    name: 'My Favorites',
    description: 'Articles I love',
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'user-123',
  };

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollectionsService,
        {
          provide: PrismaService,
          useValue: {
            collection: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            collectionItem: {
              create: jest.fn(),
              findUnique: jest.fn(),
              delete: jest.fn(),
            },
            bookmark: {
              findUnique: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
              findMany: jest.fn(),
            },
            article: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CollectionsService>(CollectionsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a collection', async () => {
      prismaService.collection.create.mockResolvedValue(mockCollection);

      const result = await service.create('user-123', {
        name: 'My Favorites',
        description: 'Articles I love',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCollection);
      expect(prismaService.collection.create).toHaveBeenCalledWith({
        data: {
          name: 'My Favorites',
          description: 'Articles I love',
          isPublic: false,
          userId: 'user-123',
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return user collections', async () => {
      prismaService.collection.findMany.mockResolvedValue([
        { ...mockCollection, items: [], _count: { items: 0 } },
      ]);

      const result = await service.findAll('user-123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(prismaService.collection.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return collection when owner', async () => {
      prismaService.collection.findUnique.mockResolvedValue({
        ...mockCollection,
        items: [],
        user: { id: 'user-123', username: 'testuser', name: 'Test User' },
        _count: { items: 0 },
      });

      const result = await service.findOne('col-123', 'user-123');

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException when not found', async () => {
      prismaService.collection.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', 'user-123')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for private collection of another user', async () => {
      prismaService.collection.findUnique.mockResolvedValue({
        ...mockCollection,
        isPublic: false,
        userId: 'other-user',
        items: [],
        user: { id: 'other-user', username: 'other', name: 'Other' },
        _count: { items: 0 },
      });

      await expect(service.findOne('col-123', 'user-123')).rejects.toThrow(ForbiddenException);
    });

    it('should allow public collection access', async () => {
      prismaService.collection.findUnique.mockResolvedValue({
        ...mockCollection,
        isPublic: true,
        userId: 'other-user',
        items: [],
        user: { id: 'other-user', username: 'other', name: 'Other' },
        _count: { items: 0 },
      });

      const result = await service.findOne('col-123', 'user-123');

      expect(result.success).toBe(true);
    });
  });

  describe('update', () => {
    it('should update collection when owner', async () => {
      prismaService.collection.findUnique.mockResolvedValue(mockCollection);
      prismaService.collection.update.mockResolvedValue({
        ...mockCollection,
        name: 'New Name',
      });

      const result = await service.update('col-123', 'user-123', { name: 'New Name' });

      expect(result.success).toBe(true);
      expect(prismaService.collection.update).toHaveBeenCalledWith({
        where: { id: 'col-123' },
        data: { name: 'New Name' },
      });
    });

    it('should throw ForbiddenException when not owner', async () => {
      prismaService.collection.findUnique.mockResolvedValue({
        ...mockCollection,
        userId: 'other-user',
      });

      await expect(
        service.update('col-123', 'user-123', { name: 'New Name' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should delete collection when owner', async () => {
      prismaService.collection.findUnique.mockResolvedValue(mockCollection);
      prismaService.collection.delete.mockResolvedValue(mockCollection);

      const result = await service.delete('col-123', 'user-123');

      expect(result.success).toBe(true);
      expect(prismaService.collection.delete).toHaveBeenCalledWith({ where: { id: 'col-123' } });
    });

    it('should throw ForbiddenException when not owner', async () => {
      prismaService.collection.findUnique.mockResolvedValue({
        ...mockCollection,
        userId: 'other-user',
      });

      await expect(service.delete('col-123', 'user-123')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('toggleBookmark', () => {
    it('should add bookmark when not exists', async () => {
      prismaService.article.findUnique.mockResolvedValue(mockArticle);
      prismaService.bookmark.findUnique.mockResolvedValue(null);
      prismaService.bookmark.create.mockResolvedValue({
        userId: 'user-123',
        articleId: 'article-123',
      });

      const result = await service.toggleBookmark('user-123', 'test-article-abc123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ bookmarked: true });
      expect(prismaService.bookmark.create).toHaveBeenCalled();
    });

    it('should remove bookmark when exists', async () => {
      prismaService.article.findUnique.mockResolvedValue(mockArticle);
      prismaService.bookmark.findUnique.mockResolvedValue({
        userId: 'user-123',
        articleId: 'article-123',
      });
      prismaService.bookmark.delete.mockResolvedValue({});

      const result = await service.toggleBookmark('user-123', 'test-article-abc123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ bookmarked: false });
      expect(prismaService.bookmark.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when article not found', async () => {
      prismaService.article.findUnique.mockResolvedValue(null);

      await expect(
        service.toggleBookmark('user-123', 'nonexistent-slug'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getBookmarks', () => {
    it('should return user bookmarks', async () => {
      prismaService.bookmark.findMany.mockResolvedValue([
        {
          article: {
            ...mockArticle,
            author: { id: 'user-123', username: 'testuser', name: 'Test User', avatar: null },
          },
        },
      ]);

      const result = await service.getBookmarks('user-123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });
});

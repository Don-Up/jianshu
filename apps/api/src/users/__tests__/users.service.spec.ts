import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users.service';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let usersService: UsersService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    name: 'Test User',
    password: '$2a$10$hashedpassword',
    bio: 'Hello world',
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            follow: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
            },
            article: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUsername', () => {
    it('should return user profile with counts', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue({
        ...mockUser,
        _count: {
          articles: 5,
          followers: 10,
          following: 3,
        },
      });

      const result = await usersService.findByUsername('testuser');

      expect(result.success).toBe(true);
      expect(result.data.username).toBe('testuser');
      expect(result.data.articleCount).toBe(5);
      expect(result.data.followerCount).toBe(10);
      expect(result.data.followingCount).toBe(3);
      expect((result.data as any).password).toBeUndefined();
    });

    it('should throw NotFoundException if user not found', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(usersService.findByUsername('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update user profile', async () => {
      prismaService.user.update = jest.fn().mockResolvedValue({
        ...mockUser,
        name: 'Updated Name',
        bio: 'Updated bio',
      });

      const result = await usersService.update('user-123', {
        name: 'Updated Name',
        bio: 'Updated bio',
      });

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Updated Name');
      expect((result.data as any).password).toBeUndefined();
    });
  });

  describe('follow', () => {
    it('should follow a user successfully', async () => {
      prismaService.user.findUnique = jest.fn()
        .mockResolvedValueOnce({ id: 'user-456' }) // following user exists
        .mockResolvedValueOnce(null); // not already following
      prismaService.follow.findUnique = jest.fn().mockResolvedValue(null);
      prismaService.follow.create = jest.fn().mockResolvedValue({});

      const result = await usersService.follow('user-123', 'user-456');

      expect(result.success).toBe(true);
      expect(result.data!.isFollowing).toBe(true);
    });

    it('should unfollow if already following', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue({ id: 'user-456' });
      prismaService.follow.findUnique = jest.fn().mockResolvedValue({ followerId: 'user-123', followingId: 'user-456' });
      prismaService.follow.delete = jest.fn().mockResolvedValue({});

      const result = await usersService.follow('user-123', 'user-456');

      expect(result.success).toBe(true);
      expect(result.data!.isFollowing).toBe(false);
    });

    it('should throw NotFoundException if user to follow not found', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(usersService.follow('user-123', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return error if trying to follow self', async () => {
      const result = await usersService.follow('user-123', 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot follow yourself');
    });
  });

  describe('getFollowers', () => {
    it('should return paginated followers list', async () => {
      prismaService.follow.findMany = jest.fn().mockResolvedValue([
        { follower: { id: 'follower-1', username: 'follower1', name: 'Follower 1', avatar: null, bio: null } },
      ]);
      prismaService.follow.count = jest.fn().mockResolvedValue(1);

      const result = await usersService.getFollowers('user-123', 1, 20);

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(1);
      expect(result.data.total).toBe(1);
      expect(result.data.page).toBe(1);
    });

    it('should return empty list if no followers', async () => {
      prismaService.follow.findMany = jest.fn().mockResolvedValue([]);
      prismaService.follow.count = jest.fn().mockResolvedValue(0);

      const result = await usersService.getFollowers('user-123', 1, 20);

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(0);
      expect(result.data.total).toBe(0);
    });
  });

  describe('getFollowing', () => {
    it('should return paginated following list', async () => {
      prismaService.follow.findMany = jest.fn().mockResolvedValue([
        { following: { id: 'following-1', username: 'following1', name: 'Following 1', avatar: null, bio: null } },
      ]);
      prismaService.follow.count = jest.fn().mockResolvedValue(1);

      const result = await usersService.getFollowing('user-123', 1, 20);

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(1);
      expect(result.data.total).toBe(1);
    });
  });

  describe('getUserArticles', () => {
    it('should return paginated articles for user', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      prismaService.article.findMany = jest.fn().mockResolvedValue([
        {
          id: 'article-1',
          title: 'Test Article',
          slug: 'test-article',
          content: 'Content here',
          excerpt: 'Excerpt',
          coverImage: null,
          likeCount: 5,
          commentCount: 2,
          readCount: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
          author: { id: 'user-123', username: 'testuser', name: 'Test User', avatar: null },
          tags: [],
          likes: [],
          bookmarks: [],
        },
      ]);
      prismaService.article.count = jest.fn().mockResolvedValue(1);

      const result = await usersService.getUserArticles('testuser', 1, 20);

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].title).toBe('Test Article');
      expect(result.data.total).toBe(1);
    });

    it('should throw NotFoundException if user not found', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(usersService.getUserArticles('nonexistent', 1, 20)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const hashedPassword = await bcrypt.hash('oldpassword', 10);
      prismaService.user.findUnique = jest.fn().mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });
      prismaService.user.update = jest.fn().mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });

      const result = await usersService.changePassword('user-123', 'oldpassword', 'newpassword123');

      expect(result.success).toBe(true);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { password: expect.any(String) },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        usersService.changePassword('nonexistent', 'oldpassword', 'newpassword')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if current password is wrong', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      prismaService.user.findUnique = jest.fn().mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });

      await expect(
        usersService.changePassword('user-123', 'wrongpassword', 'newpassword')
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});

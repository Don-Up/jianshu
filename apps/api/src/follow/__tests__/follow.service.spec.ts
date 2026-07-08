import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FollowService } from '../follow.service';
import { PrismaService } from '../../prisma.service';

describe('FollowService', () => {
  let service: FollowService;
  let prismaService: any;

  const mockUser = {
    id: 'user-123',
    username: 'testuser',
    name: 'Test User',
    email: 'test@test.com',
    password: 'hashed',
    bio: 'Test bio',
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser2 = {
    ...mockUser,
    id: 'user-456',
    username: 'otheruser',
  };

  const mockFollow = {
    followerId: 'user-123',
    followingId: 'user-456',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
            follow: {
              findUnique: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<FollowService>(FollowService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('follow', () => {
    it('should follow a user successfully', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser2);
      prismaService.follow.findUnique.mockResolvedValue(null);
      prismaService.follow.create.mockResolvedValue(mockFollow);

      const result = await service.follow('user-123', 'otheruser');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ following: true });
      expect(prismaService.follow.create).toHaveBeenCalledWith({
        data: { followerId: 'user-123', followingId: 'user-456' },
      });
    });

    it('should unfollow if already following', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser2);
      prismaService.follow.findUnique.mockResolvedValue(mockFollow);
      prismaService.follow.delete.mockResolvedValue(mockFollow);

      const result = await service.follow('user-123', 'otheruser');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ following: false });
      expect(prismaService.follow.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.follow('user-123', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return following: false when trying to follow self', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.follow('user-123', 'testuser');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ following: false });
      expect(prismaService.follow.create).not.toHaveBeenCalled();
    });
  });

  describe('getFollowers', () => {
    it('should return paginated followers', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser2);
      prismaService.follow.findMany.mockResolvedValue([
        { follower: mockUser },
      ]);
      prismaService.follow.count.mockResolvedValue(1);

      const result = await service.getFollowers('otheruser');

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(1);
      expect(result.data.total).toBe(1);
      expect(result.data.items[0].username).toBe('testuser');
    });

    it('should throw NotFoundException when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getFollowers('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should return empty list when no followers', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser2);
      prismaService.follow.findMany.mockResolvedValue([]);
      prismaService.follow.count.mockResolvedValue(0);

      const result = await service.getFollowers('otheruser');

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(0);
      expect(result.data.total).toBe(0);
    });
  });

  describe('getFollowing', () => {
    it('should return paginated following', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.follow.findMany.mockResolvedValue([
        { following: mockUser2 },
      ]);
      prismaService.follow.count.mockResolvedValue(1);

      const result = await service.getFollowing('testuser');

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(1);
      expect(result.data.total).toBe(1);
      expect(result.data.items[0].username).toBe('otheruser');
    });
  });

  describe('getStats', () => {
    it('should return follower and following counts', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.follow.count
        .mockResolvedValueOnce(100) // followersCount
        .mockResolvedValueOnce(50); // followingCount

      const result = await service.getStats('testuser');

      expect(result.success).toBe(true);
      expect(result.data.followersCount).toBe(100);
      expect(result.data.followingCount).toBe(50);
    });

    it('should throw NotFoundException when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getStats('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('isFollowing', () => {
    it('should return following: true when following', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser2);
      prismaService.follow.findUnique.mockResolvedValue(mockFollow);

      const result = await service.isFollowing('user-123', 'otheruser');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ following: true });
    });

    it('should return following: false when not following', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser2);
      prismaService.follow.findUnique.mockResolvedValue(null);

      const result = await service.isFollowing('user-123', 'otheruser');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ following: false });
    });

    it('should return following: false when target user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.isFollowing('user-123', 'nonexistent');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ following: false });
    });
  });
});

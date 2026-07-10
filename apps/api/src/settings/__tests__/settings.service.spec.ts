import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SettingsService } from '../settings.service';
import { PrismaService } from '../../prisma.service';

describe('SettingsService', () => {
  let settingsService: SettingsService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    name: 'Test User',
    password: 'hashed',
    bio: 'Test bio',
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPreferences = {
    id: 'pref-123',
    userId: 'user-123',
    comment: true,
    like: true,
    follow: true,
    system: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            notificationPreference: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    settingsService = module.get<SettingsService>(SettingsService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should return user settings with notification preferences', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      prismaService.notificationPreference.findUnique = jest.fn().mockResolvedValue(mockPreferences);

      const result = await settingsService.getSettings('user-123');

      expect(result.success).toBe(true);
      expect(result.data.user.username).toBe('testuser');
      expect(result.data.notificationPreferences.comment).toBe(true);
    });

    it('should return default notification preferences if none exist', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      prismaService.notificationPreference.findUnique = jest.fn().mockResolvedValue(null);

      const result = await settingsService.getSettings('user-123');

      expect(result.success).toBe(true);
      expect(result.data.notificationPreferences.comment).toBe(true);
      expect(result.data.notificationPreferences.like).toBe(true);
    });

    it('should throw NotFoundException if user not found', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(settingsService.getSettings('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSettings', () => {
    it('should update user settings', async () => {
      const updatedUser = { ...mockUser, name: 'Updated Name', bio: 'Updated bio' };
      prismaService.user.update = jest.fn().mockResolvedValue(updatedUser);

      const result = await settingsService.updateSettings('user-123', {
        name: 'Updated Name',
        bio: 'Updated bio',
      });

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Updated Name');
      expect(result.data.bio).toBe('Updated bio');
    });

    it('should only update provided fields', async () => {
      const updatedUser = { ...mockUser, name: 'New Name' };
      prismaService.user.update = jest.fn().mockResolvedValue(updatedUser);

      const result = await settingsService.updateSettings('user-123', {
        name: 'New Name',
      });

      expect(result.success).toBe(true);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { name: 'New Name' },
        select: expect.any(Object),
      });
    });
  });

  describe('updateNotificationPreferences', () => {
    it('should create preferences if none exist', async () => {
      prismaService.notificationPreference.findUnique = jest.fn().mockResolvedValue(null);
      prismaService.notificationPreference.create = jest.fn().mockResolvedValue(mockPreferences);

      const result = await settingsService.updateNotificationPreferences('user-123', {
        comment: false,
      });

      expect(result.success).toBe(true);
      expect(prismaService.notificationPreference.create).toHaveBeenCalled();
    });

    it('should update existing preferences', async () => {
      const updatedPrefs = { ...mockPreferences, comment: false };
      prismaService.notificationPreference.findUnique = jest.fn().mockResolvedValue(mockPreferences);
      prismaService.notificationPreference.update = jest.fn().mockResolvedValue(updatedPrefs);

      const result = await settingsService.updateNotificationPreferences('user-123', {
        comment: false,
      });

      expect(result.success).toBe(true);
      expect(result.data.comment).toBe(false);
    });
  });

  describe('deleteAccount', () => {
    it('should delete user account', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      prismaService.user.delete = jest.fn().mockResolvedValue(mockUser);

      const result = await settingsService.deleteAccount('user-123');

      expect(result.success).toBe(true);
      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(settingsService.deleteAccount('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '../notifications.service';
import { PrismaService } from '../../prisma.service';
import { NotificationsGateway } from '../../gateway/notifications.gateway';

describe('NotificationsService', () => {
  let notificationsService: NotificationsService;
  let prismaService: jest.Mocked<PrismaService>;
  let notificationsGateway: jest.Mocked<NotificationsGateway>;

  const mockNotification = {
    id: 'notification-123',
    type: 'COMMENT',
    message: '评论了你的文章',
    link: '/articles/test-article',
    isRead: false,
    createdAt: new Date(),
    userId: 'user-123',
    actorId: 'user-456',
    articleId: 'article-123',
    actor: {
      id: 'user-456',
      username: 'commenter',
      name: 'Commenter User',
      avatar: null,
    },
  };

  beforeEach(async () => {
    const mockGateway = {
      notifyUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: {
            notification: {
              findMany: jest.fn(),
              count: jest.fn(),
              updateMany: jest.fn(),
              create: jest.fn(),
            },
            notificationPreference: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: NotificationsGateway,
          useValue: mockGateway,
        },
      ],
    }).compile();

    notificationsService = module.get<NotificationsService>(NotificationsService);
    prismaService = module.get(PrismaService);
    notificationsGateway = module.get(NotificationsGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated notifications for a user', async () => {
      prismaService.notification.findMany = jest.fn().mockResolvedValue([mockNotification]);
      prismaService.notification.count = jest.fn().mockResolvedValue(1);

      const result = await notificationsService.findAll('user-123', { page: 1, limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].type).toBe('COMMENT');
      expect(result.data.total).toBe(1);
      expect(result.data.unreadCount).toBe(1);
      expect(result.data.page).toBe(1);
      expect(result.data.totalPages).toBe(1);
    });

    it('should return empty list when no notifications', async () => {
      prismaService.notification.findMany = jest.fn().mockResolvedValue([]);
      prismaService.notification.count = jest.fn().mockResolvedValue(0);

      const result = await notificationsService.findAll('user-123', { page: 1, limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(0);
      expect(result.data.total).toBe(0);
      expect(result.data.unreadCount).toBe(0);
    });

    it('should use default pagination values', async () => {
      prismaService.notification.findMany = jest.fn().mockResolvedValue([]);
      prismaService.notification.count = jest.fn().mockResolvedValue(0);

      await notificationsService.findAll('user-123', {});

      expect(prismaService.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should calculate correct pagination', async () => {
      prismaService.notification.findMany = jest.fn().mockResolvedValue([mockNotification]);
      prismaService.notification.count = jest.fn().mockResolvedValue(45);

      const result = await notificationsService.findAll('user-123', { page: 2, limit: 20 });

      expect(result.data.totalPages).toBe(3);
      expect(prismaService.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        })
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      prismaService.notification.updateMany = jest.fn().mockResolvedValue({ count: 1 });

      const result = await notificationsService.markAsRead('notification-123', 'user-123');

      expect(result.success).toBe(true);
      expect(prismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 'notification-123', userId: 'user-123' },
        data: { isRead: true },
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for a user', async () => {
      prismaService.notification.updateMany = jest.fn().mockResolvedValue({ count: 5 });

      const result = await notificationsService.markAllAsRead('user-123');

      expect(result.success).toBe(true);
      expect(prismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-123', isRead: false },
        data: { isRead: true },
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      prismaService.notification.count = jest.fn().mockResolvedValue(3);

      const result = await notificationsService.getUnreadCount('user-123');

      expect(result.success).toBe(true);
      expect(result.data.count).toBe(3);
      expect(prismaService.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-123', isRead: false },
      });
    });

    it('should return zero when no unread notifications', async () => {
      prismaService.notification.count = jest.fn().mockResolvedValue(0);

      const result = await notificationsService.getUnreadCount('user-123');

      expect(result.success).toBe(true);
      expect(result.data.count).toBe(0);
    });
  });

  describe('getPreferences', () => {
    const mockPreference = {
      id: 'pref-123',
      userId: 'user-123',
      comment: true,
      like: true,
      follow: false,
      system: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return existing preferences', async () => {
      prismaService.notificationPreference.findUnique = jest.fn().mockResolvedValue(mockPreference);

      const result = await notificationsService.getPreferences('user-123');

      expect(result.success).toBe(true);
      expect(result.data.comment).toBe(true);
      expect(result.data.follow).toBe(false);
    });

    it('should create default preferences if not exists', async () => {
      prismaService.notificationPreference.findUnique = jest.fn().mockResolvedValue(null);
      prismaService.notificationPreference.create = jest.fn().mockResolvedValue({
        ...mockPreference,
        comment: true,
        like: true,
        follow: true,
        system: true,
      });

      const result = await notificationsService.getPreferences('user-123');

      expect(result.success).toBe(true);
      expect(prismaService.notificationPreference.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          comment: true,
          like: true,
          follow: true,
          system: true,
        },
      });
    });
  });

  describe('updatePreferences', () => {
    const mockPreference = {
      id: 'pref-123',
      userId: 'user-123',
      comment: false,
      like: true,
      follow: true,
      system: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update existing preferences', async () => {
      prismaService.notificationPreference.findUnique = jest.fn().mockResolvedValue(mockPreference);
      prismaService.notificationPreference.update = jest.fn().mockResolvedValue({
        ...mockPreference,
        comment: false,
      });

      const result = await notificationsService.updatePreferences('user-123', { comment: false });

      expect(result.success).toBe(true);
      expect(result.data.comment).toBe(false);
    });

    it('should create preferences if not exists', async () => {
      prismaService.notificationPreference.findUnique = jest.fn().mockResolvedValue(null);
      prismaService.notificationPreference.create = jest.fn().mockResolvedValue(mockPreference);

      const result = await notificationsService.updatePreferences('user-123', { comment: false });

      expect(result.success).toBe(true);
      expect(prismaService.notificationPreference.create).toHaveBeenCalled();
    });
  });

  describe('getGroupedNotifications', () => {
    it('should group notifications by date', async () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

      const mockNotifications = [
        { ...mockNotification, createdAt: now },
        { ...mockNotification, id: '2', createdAt: yesterday },
        { ...mockNotification, id: '3', createdAt: twoWeeksAgo },
      ];

      prismaService.notification.findMany = jest.fn().mockResolvedValue(mockNotifications);

      const result = await notificationsService.getGroupedNotifications('user-123');

      expect(result.success).toBe(true);
      expect(result.data.today).toHaveLength(1);
      expect(result.data.yesterday).toHaveLength(1);
      expect(result.data.thisWeek).toHaveLength(0);
      expect(result.data.older).toHaveLength(1);
    });

    it('should return empty groups when no notifications', async () => {
      prismaService.notification.findMany = jest.fn().mockResolvedValue([]);

      const result = await notificationsService.getGroupedNotifications('user-123');

      expect(result.success).toBe(true);
      expect(result.data.today).toHaveLength(0);
      expect(result.data.yesterday).toHaveLength(0);
      expect(result.data.thisWeek).toHaveLength(0);
      expect(result.data.older).toHaveLength(0);
    });
  });
});
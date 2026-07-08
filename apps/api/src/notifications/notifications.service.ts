import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { NotificationsGateway } from '../gateway/notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
  ) {}

  async findAll(userId: string, query: QueryNotificationDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        include: {
          actor: {
            select: { id: true, username: true, name: true, avatar: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      success: true,
      data: {
        items: notifications,
        total,
        unreadCount,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markAsRead(id: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });

    return { success: true };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { success: true };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { success: true, data: { count } };
  }

  async createNotification(params: {
    userId: string;
    type: 'COMMENT' | 'LIKE' | 'FOLLOW' | 'SYSTEM';
    message: string;
    actorId?: string;
    articleId?: string;
    link?: string;
  }) {
    const { userId, type, message, actorId, articleId, link } = params;

    // Don't notify yourself
    if (actorId === userId) {
      return { success: true };
    }

    // Check user notification preferences
    const preferences = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (preferences && !preferences[type.toLowerCase() as keyof Omit<typeof preferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>]) {
      return { success: true, data: { skipped: true } };
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        message,
        actorId,
        articleId,
        link,
      },
    });

    // Emit notification via WebSocket
    this.notificationsGateway.notifyUser(userId, notification);

    return { success: true };
  }

  async getPreferences(userId: string) {
    let preferences = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!preferences) {
      preferences = await this.prisma.notificationPreference.create({
        data: {
          userId,
          comment: true,
          like: true,
          follow: true,
          system: true,
        },
      });
    }

    return { success: true, data: preferences };
  }

  async updatePreferences(
    userId: string,
    data: { comment?: boolean; like?: boolean; follow?: boolean; system?: boolean },
  ) {
    let preferences = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!preferences) {
      preferences = await this.prisma.notificationPreference.create({
        data: {
          userId,
          comment: data.comment ?? true,
          like: data.like ?? true,
          follow: data.follow ?? true,
          system: data.system ?? true,
        },
      });
    } else {
      preferences = await this.prisma.notificationPreference.update({
        where: { userId },
        data,
      });
    }

    return { success: true, data: preferences };
  }

  async getGroupedNotifications(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      include: {
        actor: {
          select: { id: true, username: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by date (today, yesterday, this week, older)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const groups = {
      today: [] as typeof notifications,
      yesterday: [] as typeof notifications,
      thisWeek: [] as typeof notifications,
      older: [] as typeof notifications,
    };

    for (const n of notifications) {
      const createdAt = new Date(n.createdAt);
      if (createdAt >= today) {
        groups.today.push(n);
      } else if (createdAt >= yesterday) {
        groups.yesterday.push(n);
      } else if (createdAt >= weekAgo) {
        groups.thisWeek.push(n);
      } else {
        groups.older.push(n);
      }
    }

    return { success: true, data: groups };
  }
}
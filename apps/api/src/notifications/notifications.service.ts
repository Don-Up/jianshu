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
}
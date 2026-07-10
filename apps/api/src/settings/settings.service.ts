import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UpdateNotificationPreferencesDto } from './dto/notification-preferences.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const notificationPreferences = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          bio: user.bio,
          avatar: user.avatar,
          createdAt: user.createdAt,
        },
        notificationPreferences: notificationPreferences || {
          comment: true,
          like: true,
          follow: true,
          system: true,
        },
      },
    };
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      data: user,
    };
  }

  async updateNotificationPreferences(userId: string, dto: UpdateNotificationPreferencesDto) {
    let preferences = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!preferences) {
      preferences = await this.prisma.notificationPreference.create({
        data: {
          userId,
          comment: dto.comment ?? true,
          like: dto.like ?? true,
          follow: dto.follow ?? true,
          system: dto.system ?? true,
        },
      });
    } else {
      preferences = await this.prisma.notificationPreference.update({
        where: { userId },
        data: dto,
      });
    }

    return {
      success: true,
      data: preferences,
    };
  }

  async deleteAccount(userId: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete user (cascade will handle related records)
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { success: true };
  }
}

import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        _count: {
          select: {
            articles: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...result } = user;
    return {
      success: true,
      data: {
        ...result,
        articleCount: user._count.articles,
        followerCount: user._count.followers,
        followingCount: user._count.following,
      },
    };
  }

  async update(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });

    const { password, ...result } = user;
    return {
      success: true,
      data: result,
    };
  }

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      return { success: false, error: 'Cannot follow yourself' };
    }

    const following = await this.prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!following) {
      throw new NotFoundException('User not found');
    }

    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      await this.prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });
      return {
        success: true,
        data: { isFollowing: false },
      };
    } else {
      await this.prisma.follow.create({
        data: {
          followerId,
          followingId,
        },
      });

      // Create FOLLOW notification
      await this.notificationsService.createNotification({
        userId: followingId,
        type: 'FOLLOW',
        message: '关注了你',
        actorId: followerId,
        link: `/user/${following.username}`,
      });

      return {
        success: true,
        data: { isFollowing: true },
      };
    }
  }

  async getFollowers(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              bio: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.follow.count({ where: { followingId: userId } }),
    ]);

    return {
      success: true,
      data: {
        items: followers.map((f) => f.follower),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getFollowing(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              bio: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.follow.count({ where: { followerId: userId } }),
    ]);

    return {
      success: true,
      data: {
        items: following.map((f) => f.following),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserArticles(username: string, page: number = 1, limit: number = 20, requestUserId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where: { authorId: user.id, published: true },
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
          likes: requestUserId ? { where: { userId: requestUserId } } : false,
          bookmarks: requestUserId ? { where: { userId: requestUserId } } : false,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.article.count({ where: { authorId: user.id, published: true } }),
    ]);

    return {
      success: true,
      data: {
        items: articles.map((a) => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          content: a.content,
          excerpt: a.excerpt,
          coverImage: a.coverImage,
          likeCount: a.likeCount,
          commentCount: a.commentCount,
          readCount: a.readCount,
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
          author: a.author,
          tags: a.tags?.map((t) => t.tag.name) || [],
          isLiked: a.likes?.length > 0 || false,
          isBookmarked: a.bookmarks?.length > 0 || false,
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException('当前密码错误');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true };
  }
}

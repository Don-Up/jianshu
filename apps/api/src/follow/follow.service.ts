import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class FollowService {
  constructor(private prisma: PrismaService) {}

  async follow(followerId: string, followingUsername: string) {
    const following = await this.prisma.user.findUnique({
      where: { username: followingUsername },
    });

    if (!following) {
      throw new NotFoundException('User not found');
    }

    if (followerId === following.id) {
      return { success: true, data: { following: false } };
    }

    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: following.id,
        },
      },
    });

    if (existing) {
      // Unfollow
      await this.prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId: following.id,
          },
        },
      });
      return { success: true, data: { following: false } };
    } else {
      // Follow
      await this.prisma.follow.create({
        data: {
          followerId,
          followingId: following.id,
        },
      });
      return { success: true, data: { following: true } };
    }
  }

  async getFollowers(username: string, page = 1, limit = 20) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followingId: user.id },
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
      this.prisma.follow.count({ where: { followingId: user.id } }),
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

  async getFollowing(username: string, page = 1, limit = 20) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerId: user.id },
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
      this.prisma.follow.count({ where: { followerId: user.id } }),
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

  async getStats(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [followersCount, followingCount] = await Promise.all([
      this.prisma.follow.count({ where: { followingId: user.id } }),
      this.prisma.follow.count({ where: { followerId: user.id } }),
    ]);

    return {
      success: true,
      data: {
        followersCount,
        followingCount,
      },
    };
  }

  async isFollowing(followerId: string, followingUsername: string) {
    const following = await this.prisma.user.findUnique({
      where: { username: followingUsername },
    });

    if (!following) {
      return { success: true, data: { following: false } };
    }

    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: following.id,
        },
      },
    });

    return { success: true, data: { following: !!existing } };
  }
}

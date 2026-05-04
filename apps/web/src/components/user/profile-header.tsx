'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { userApi } from '@/lib/api';
import type { User } from '@jianshu/shared';

interface ProfileHeaderProps {
  user: User;
  isOwnProfile?: boolean;
  initialIsFollowing?: boolean;
}

export function ProfileHeader({ user, isOwnProfile, initialIsFollowing }: ProfileHeaderProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing || false);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);

  const handleFollow = async () => {
    setIsFollowingLoading(true);
    try {
      const res = await userApi.follow(user.id);
      if (res.success && res.data) {
        setIsFollowing(res.data.isFollowing);
      }
    } catch (error) {
      console.error('Failed to follow/unfollow:', error);
    } finally {
      setIsFollowingLoading(false);
    }
  };

  return (
    <div className="bg-background border-b">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-start gap-6">
          <Avatar className="h-20 w-20 text-lg">
            <AvatarImage src={user.avatar || undefined} />
            <AvatarFallback>
              {user.name?.slice(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
              {user.bio && <span className="text-muted-foreground">·</span>}
              {user.bio && <p className="text-muted-foreground">{user.bio}</p>}
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
              <span>
                <strong className="text-foreground">{user.followerCount || 0}</strong> 粉丝
              </span>
              <span>
                <strong className="text-foreground">{user.followingCount || 0}</strong> 关注
              </span>
              <span>
                <strong className="text-foreground">{user.articleCount || 0}</strong> 文章
              </span>
            </div>

            {!isOwnProfile && (
              <Button
                variant={isFollowing ? 'secondary' : 'default'}
                size="sm"
                onClick={handleFollow}
                disabled={isFollowingLoading}
              >
                {isFollowing ? '已关注' : '关注'}
              </Button>
            )}

            {isOwnProfile && (
              <Button variant="secondary" size="sm">编辑个人资料</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
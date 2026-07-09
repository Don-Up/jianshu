'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserStats } from './user-stats';
import { useFollow } from '@/hooks/use-follow';
import type { User } from '@jianshu/shared';

interface ProfileHeaderProps {
  user: User;
  isOwnProfile?: boolean;
  initialIsFollowing?: boolean;
}

export function ProfileHeader({ user, isOwnProfile, initialIsFollowing }: ProfileHeaderProps) {
  const { isFollowing, isPending, toggleFollow } = useFollow(
    user.id,
    user.username,
    initialIsFollowing
  );

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

            <UserStats
              followersCount={user.followerCount || 0}
              followingCount={user.followingCount || 0}
              articlesCount={user.articleCount || 0}
            />

            {!isOwnProfile && (
              <Button
                variant={isFollowing ? 'secondary' : 'default'}
                size="sm"
                onClick={toggleFollow}
                disabled={isPending}
                className="mt-4"
              >
                {isPending ? '处理中...' : isFollowing ? '已关注' : '关注'}
              </Button>
            )}

            {isOwnProfile && (
              <Button variant="secondary" size="sm" className="mt-4">编辑个人资料</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

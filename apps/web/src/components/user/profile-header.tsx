'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserStats } from './user-stats';
import { useFollow } from '@/hooks/use-follow';
import { useFollowingStatus } from '@/hooks/use-following-status';
import type { User } from '@jianshu/shared';

interface ProfileHeaderProps {
  user: User;
  isOwnProfile?: boolean;
}

export function ProfileHeader({ user, isOwnProfile }: ProfileHeaderProps) {
  const { isFollowing, isLoading } = useFollowingStatus(user.username, !isOwnProfile);
  const { isFollowing: followState, isPending, toggleFollow } = useFollow(user.id, user.username, isFollowing);

  // Use followState for button display since it updates optimistically
  const displayFollowing = followState;
  

  if (isLoading && !isOwnProfile) {
    return (
      <div className="bg-background border-b">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-start gap-6">
            <div className="h-20 w-20 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-3">
              <div className="h-8 w-48 bg-muted animate-pulse rounded" />
              <div className="h-4 w-64 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                variant={displayFollowing ? 'secondary' : 'default'}
                size="sm"
                onClick={() => toggleFollow()}
                disabled={isPending}
                className="mt-4"
              >
                {isPending ? '处理中...' : displayFollowing ? '已关注' : '关注'}
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

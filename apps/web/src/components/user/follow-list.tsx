'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { userApi } from '@/lib/api';
import type { User } from '@jianshu/shared';
import { useAuth } from '@/hooks/use-auth';
import { useFollow } from '@/hooks/use-follow';

interface FollowListProps {
  username: string;
  type: 'followers' | 'following';
}

function FollowItem({ user, isOwnProfile }: { user: User; isOwnProfile: boolean }) {
  const { user: currentUser } = useAuth();
  const { isFollowing, isPending, toggleFollow } = useFollow(
    user.id,
    user.username,
    false // We'll let the query determine initial state
  );

  return (
    <div className="flex items-center justify-between py-3">
      <Link href={`/user/${user.username}`} className="flex items-center gap-3 flex-1 hover:opacity-80">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.avatar || undefined} />
          <AvatarFallback>
            {user.name?.slice(0, 2).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-foreground">{user.name}</p>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
        </div>
      </Link>
      {!isOwnProfile && currentUser && currentUser.id !== user.id && (
        <Button
          variant={isFollowing ? 'secondary' : 'default'}
          size="sm"
          onClick={toggleFollow}
          disabled={isPending}
        >
          {isPending ? '处理中...' : isFollowing ? '已关注' : '关注'}
        </Button>
      )}
    </div>
  );
}

export function FollowList({ username, type }: FollowListProps) {
  const { user: currentUser } = useAuth();
  const queryFn = type === 'followers' ? userApi.getFollowers : userApi.getFollowing;

  const { data, isLoading } = useQuery({
    queryKey: [type, username],
    queryFn: () => queryFn(username, { page: 1, limit: 50 }),
  });

  const users = data?.data?.items || [];
  const isOwnProfile = currentUser?.username === username;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-3 w-16 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {type === 'followers' ? '暂无粉丝' : '暂无关注'}
      </div>
    );
  }

  return (
    <div>
      {users.map((user) => (
        <FollowItem key={user.id} user={user} isOwnProfile={isOwnProfile} />
      ))}
    </div>
  );
}

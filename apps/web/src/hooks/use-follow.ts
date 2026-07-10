'use client';

import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { userApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

interface UseFollowResult {
  isFollowing: boolean;
  isPending: boolean;
  follow: () => void;
  unfollow: () => void;
  toggleFollow: () => void;
}

export function useFollow(
  targetUserId: string,
  targetUsername: string,
  initialIsFollowing: boolean = false
): UseFollowResult {
  const [optimisticIsFollowing, setOptimisticIsFollowing] = useState(initialIsFollowing);
  const isFirstRender = useRef(true);
  const queryClient = useQueryClient();

  // Sync internal state when initialIsFollowing prop changes (after initial render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setOptimisticIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  const followMutation = useMutation({
    mutationFn: () => userApi.follow(targetUserId),
    onMutate: () => {
      // Optimistic update: immediately flip the state using functional update
      setOptimisticIsFollowing((prev) => !prev);
    },
    onSuccess: (res) => {
      if (res.success && res.data) {
        setOptimisticIsFollowing(res.data.isFollowing);
        // Invalidate caches to ensure fresh data on refetch
        queryClient.invalidateQueries({ queryKey: queryKeys.user(targetUsername) });
        queryClient.invalidateQueries({ queryKey: ['followingStatus', targetUsername] });
        toast.success(res.data.isFollowing ? '关注成功' : '已取消关注');
      }
    },
    onError: () => {
      // Rollback on error - flip back
      setOptimisticIsFollowing((prev) => !prev);
      toast.error('操作失败，请重试');
    },
  });

  const follow = () => followMutation.mutate();
  const unfollow = () => followMutation.mutate();
  const toggleFollow = () => followMutation.mutate();

  return {
    isFollowing: optimisticIsFollowing,
    isPending: followMutation.isPending,
    follow,
    unfollow,
    toggleFollow,
  };
}

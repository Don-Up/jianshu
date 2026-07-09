'use client';

import { useState } from 'react';
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
  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: () => userApi.follow(targetUserId),
    onMutate: async () => {
      // Optimistic update: immediately update UI
      setOptimisticIsFollowing(!optimisticIsFollowing);
    },
    onSuccess: (res) => {
      if (res.success && res.data) {
        setOptimisticIsFollowing(res.data.isFollowing);
        // Invalidate user profile cache
        queryClient.invalidateQueries({ queryKey: queryKeys.user(targetUsername) });
        toast.success(res.data.isFollowing ? '关注成功' : '已取消关注');
      }
    },
    onError: () => {
      // Rollback on error
      setOptimisticIsFollowing(!optimisticIsFollowing);
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

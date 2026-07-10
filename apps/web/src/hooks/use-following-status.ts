'use client';

import { useQuery } from '@tanstack/react-query';
import { userApi } from '@/lib/api';

interface UseFollowingStatusResult {
  isFollowing: boolean;
  isLoading: boolean;
}

export function useFollowingStatus(
  username: string,
  enabled: boolean = true
): UseFollowingStatusResult {
  const { data, isLoading } = useQuery({
    queryKey: ['followingStatus', username],
    queryFn: () => userApi.getFollowingStatus(username),
    enabled,
  });

  return {
    isFollowing: data?.data?.isFollowing || false,
    isLoading,
  };
}

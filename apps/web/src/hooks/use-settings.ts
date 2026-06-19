'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

interface UpdateProfileData {
  name?: string;
  bio?: string;
  avatar?: string;
}

interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

interface UseSettingsResult {
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  changePassword: (data: ChangePasswordData) => Promise<void>;
  isUpdatingProfile: boolean;
  isChangingPassword: boolean;
  updateProfileError: string | null;
  changePasswordError: string | null;
}

export function useSettings(): UseSettingsResult {
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileData) => userApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.authMe() });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordData) => userApi.changePassword(data),
  });

  return {
    updateProfile: async (data: UpdateProfileData) => {
      await updateProfileMutation.mutateAsync(data);
    },
    changePassword: async (data: ChangePasswordData) => {
      await changePasswordMutation.mutateAsync(data);
    },
    isUpdatingProfile: updateProfileMutation.isPending,
    isChangingPassword: changePasswordMutation.isPending,
    updateProfileError: updateProfileMutation.error?.message || null,
    changePasswordError: changePasswordMutation.error?.message || null,
  };
}

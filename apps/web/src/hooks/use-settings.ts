'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi, settingsApi } from '@/lib/api';
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

interface NotificationPreferences {
  comment: boolean;
  like: boolean;
  follow: boolean;
  system: boolean;
}

interface UseSettingsResult {
  settings: {
    user: { id: string; email: string; username: string; name: string; bio: string | null; avatar: string | null; createdAt: string };
    notificationPreferences: NotificationPreferences;
  } | undefined;
  isLoading: boolean;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  changePassword: (data: ChangePasswordData) => Promise<void>;
  updateNotificationPreferences: (data: Partial<NotificationPreferences>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  isUpdatingProfile: boolean;
  isChangingPassword: boolean;
  isUpdatingPreferences: boolean;
  isDeletingAccount: boolean;
  updateProfileError: string | null;
  changePasswordError: string | null;
}

export function useSettings(): UseSettingsResult {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.settings,
    queryFn: settingsApi.getSettings,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileData) => userApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.authMe() });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordData) => userApi.changePassword(data),
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: (data: Partial<NotificationPreferences>) => settingsApi.updateNotificationPreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => settingsApi.deleteAccount(),
  });

  return {
    settings: data?.data,
    isLoading,
    updateProfile: async (data: UpdateProfileData) => {
      await updateProfileMutation.mutateAsync(data);
    },
    changePassword: async (data: ChangePasswordData) => {
      await changePasswordMutation.mutateAsync(data);
    },
    updateNotificationPreferences: async (data: Partial<NotificationPreferences>) => {
      await updatePreferencesMutation.mutateAsync(data);
    },
    deleteAccount: async () => {
      await deleteAccountMutation.mutateAsync();
    },
    isUpdatingProfile: updateProfileMutation.isPending,
    isChangingPassword: changePasswordMutation.isPending,
    isUpdatingPreferences: updatePreferencesMutation.isPending,
    isDeletingAccount: deleteAccountMutation.isPending,
    updateProfileError: updateProfileMutation.error?.message || null,
    changePasswordError: changePasswordMutation.error?.message || null,
  };
}

'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/use-auth';
import { useSettings } from '@/hooks/use-settings';
import { profileSchema, passwordSchema, type ProfileFormData, type PasswordFormData } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const {
    settings,
    isLoading,
    updateProfile,
    changePassword,
    updateNotificationPreferences,
    deleteAccount,
    isUpdatingProfile,
    isChangingPassword,
    isUpdatingPreferences,
    isDeletingAccount,
  } = useSettings();

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      bio: user?.bio || '',
      avatar: user?.avatar || '',
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  // Update profile form when user data loads
  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
      });
    }
  }, [user, profileForm]);

  const handleUpdateProfile = async (data: ProfileFormData) => {
    try {
      await updateProfile(data);
      if (updateUser && user) {
        updateUser({ ...user, name: data.name, bio: data.bio || null, avatar: data.avatar || null });
      }
      toast.success('个人信息更新成功');
    } catch {
      toast.error('更新失败，请重试');
    }
  };

  const handleChangePassword = async (data: PasswordFormData) => {
    try {
      await changePassword({ oldPassword: data.oldPassword, newPassword: data.newPassword });
      toast.success('密码修改成功');
      passwordForm.reset();
    } catch {
      toast.error('密码修改失败，请检查当前密码是否正确');
    }
  };

  const handlePreferenceChange = async (key: 'comment' | 'like' | 'follow' | 'system', value: boolean) => {
    try {
      await updateNotificationPreferences({ [key]: value });
      toast.success('通知设置已更新');
    } catch {
      toast.error('更新失败');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('确定要删除账户吗？此操作不可撤销。')) {
      try {
        await deleteAccount();
        toast.success('账户已删除');
        window.location.href = '/';
      } catch {
        toast.error('删除失败');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const preferences = settings?.notificationPreferences || { comment: true, like: true, follow: true, system: true };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-8">设置</h1>

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-foreground">基本信息</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)} className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profileForm.watch('avatar') || undefined} />
                  <AvatarFallback className="text-lg">
                    {profileForm.watch('name')?.slice(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">头像 URL</label>
                <Input
                  {...profileForm.register('avatar')}
                  placeholder="输入头像图片 URL"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">昵称</label>
                <Input
                  {...profileForm.register('name')}
                  placeholder="输入昵称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">个人简介</label>
                <Input
                  {...profileForm.register('bio')}
                  placeholder="介绍一下自己"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">用户名</label>
                <Input value={user?.username || ''} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">邮箱</label>
                <Input value={user?.email || ''} disabled />
              </div>
              <Button type="submit" disabled={isUpdatingProfile}>
                {isUpdatingProfile ? '保存中...' : '保存修改'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-foreground">修改密码</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">当前密码</label>
                <Input
                  type="password"
                  {...passwordForm.register('oldPassword')}
                  placeholder="输入当前密码"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">新密码</label>
                <Input
                  type="password"
                  {...passwordForm.register('newPassword')}
                  placeholder="输入新密码"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">确认新密码</label>
                <Input
                  type="password"
                  {...passwordForm.register('confirmPassword')}
                  placeholder="再次输入新密码"
                />
              </div>
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? '修改中...' : '修改密码'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-foreground">通知设置</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-foreground">评论通知</label>
                <p className="text-sm text-muted-foreground">有人评论你的文章时通知</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.comment}
                onChange={(e) => handlePreferenceChange('comment', e.target.checked)}
                disabled={isUpdatingPreferences}
                className="w-5 h-5"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-foreground">点赞通知</label>
                <p className="text-sm text-muted-foreground">有人点赞你的文章时通知</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.like}
                onChange={(e) => handlePreferenceChange('like', e.target.checked)}
                disabled={isUpdatingPreferences}
                className="w-5 h-5"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-foreground">关注通知</label>
                <p className="text-sm text-muted-foreground">有人关注你时通知</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.follow}
                onChange={(e) => handlePreferenceChange('follow', e.target.checked)}
                disabled={isUpdatingPreferences}
                className="w-5 h-5"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-foreground">系统通知</label>
                <p className="text-sm text-muted-foreground">系统公告和更新通知</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.system}
                onChange={(e) => handlePreferenceChange('system', e.target.checked)}
                disabled={isUpdatingPreferences}
                className="w-5 h-5"
              />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <h2 className="font-semibold text-destructive">危险区域</h2>
            <p className="text-sm text-muted-foreground">删除账户后，所有数据将无法恢复</p>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount}
            >
              {isDeletingAccount ? '删除中...' : '删除账户'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
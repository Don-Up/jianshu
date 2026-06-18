'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { useSettings } from '@/hooks/use-settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { updateProfile, changePassword, isUpdatingProfile, isChangingPassword } = useSettings();

  // Profile form state
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');

  // Password form state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      toast.error('昵称不能为空');
      return;
    }

    try {
      await updateProfile({ name, bio, avatar });
      if (updateUser) {
        updateUser({ ...user!, name, bio, avatar });
      }
      toast.success('个人信息更新成功');
    } catch {
      toast.error('更新失败，请重试');
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword) {
      toast.error('请输入当前密码');
      return;
    }
    if (!newPassword) {
      toast.error('请输入新密码');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('新密码至少6个字符');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('两次输入的新密码不一致');
      return;
    }

    try {
      await changePassword({ oldPassword, newPassword });
      toast.success('密码修改成功');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('密码修改失败，请检查当前密码是否正确');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-8">设置</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-foreground">基本信息</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatar || undefined} />
                <AvatarFallback className="text-lg">
                  {name?.slice(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <Button variant="secondary" size="sm">更换头像</Button>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">头像 URL</label>
              <Input
                placeholder="输入头像图片 URL"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">昵称</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">个人简介</label>
              <Input
                placeholder="介绍一下自己"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
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
            <Button
              onClick={handleUpdateProfile}
              disabled={isUpdatingProfile}
            >
              {isUpdatingProfile ? '保存中...' : '保存修改'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-foreground">修改密码</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">当前密码</label>
              <Input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">新密码</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">确认新密码</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword}
            >
              {isChangingPassword ? '修改中...' : '修改密码'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
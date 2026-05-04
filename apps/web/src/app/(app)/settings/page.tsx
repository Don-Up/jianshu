'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function SettingsPage() {
  const { user } = useAuth();

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
                <AvatarImage src={user?.avatar || undefined} />
                <AvatarFallback className="text-lg">
                  {user?.name?.slice(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <Button variant="secondary" size="sm">更换头像</Button>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">昵称</label>
              <Input defaultValue={user?.name || ''} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">用户名</label>
              <Input defaultValue={user?.username || ''} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">邮箱</label>
              <Input defaultValue={user?.email || ''} disabled />
            </div>
            <Button>保存修改</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-foreground">修改密码</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">当前密码</label>
              <Input type="password" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">新密码</label>
              <Input type="password" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">确认新密码</label>
              <Input type="password" />
            </div>
            <Button>修改密码</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
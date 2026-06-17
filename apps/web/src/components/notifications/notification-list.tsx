'use client';

import Link from 'next/link';
import { useNotifications } from '@/hooks/use-notifications';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Notification } from '@jianshu/shared';

export function NotificationList() {
  const { notifications, isLoading, markAsRead, markAllAsRead } = useNotifications();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return <p className="text-center text-muted-foreground py-8">暂无通知</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">通知</h2>
        <button
          onClick={() => markAllAsRead()}
          className="text-sm text-primary hover:underline"
        >
          全部标为已读
        </button>
      </div>
      <div className="space-y-2">
        {notifications.map((notification: Notification) => (
          <Link
            key={notification.id}
            href={notification.link || '#'}
            onClick={() => !notification.isRead && markAsRead(notification.id)}
            className={cn(
              'flex gap-3 p-4 rounded-lg transition-colors',
              notification.isRead ? 'bg-background' : 'bg-primary/5'
            )}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={notification.actor?.avatar || undefined} />
              <AvatarFallback>
                {notification.actor?.name?.slice(0, 2).toUpperCase() || 'N'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{notification.actor?.name}</span>
                {' '}
                {notification.message}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(notification.createdAt)}
              </p>
            </div>
            {!notification.isRead && (
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
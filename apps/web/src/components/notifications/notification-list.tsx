'use client';

import Link from 'next/link';
import { useNotifications } from '@/hooks/use-notifications';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate, cn } from '@/lib/utils';
import type { Notification } from '@jianshu/shared';
import { useMemo } from 'react';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'FOLLOW':
        return (
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        );
      case 'LIKE':
        return (
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
        );
      case 'COMMENT':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        );
      default:
        return (
          <Avatar className="h-10 w-10">
            <AvatarImage src={notification.actor?.avatar || undefined} />
            <AvatarFallback>
              {notification.actor?.name?.slice(0, 2).toUpperCase() || 'N'}
            </AvatarFallback>
          </Avatar>
        );
    }
  };

  return (
    <Link
      href={notification.link || '#'}
      onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl transition-all duration-200',
        notification.isRead
          ? 'bg-background hover:bg-muted/50'
          : 'bg-primary/5 hover:bg-primary/10 border-l-4 border-primary'
      )}
    >
      {getNotificationIcon(notification.type)}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm leading-relaxed">
            {notification.actor && (
              <span className="font-semibold text-foreground">{notification.actor.name}</span>
            )}
            <span className="text-muted-foreground"> {notification.message}</span>
          </p>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDate(notification.createdAt)}
          </span>
        </div>
        {notification.article && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            文章: {notification.article.title}
          </p>
        )}
      </div>
      {!notification.isRead && (
        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
      )}
    </Link>
  );
}

function getDateGroup(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const notificationDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (notificationDate.getTime() >= today.getTime()) {
    return '今天';
  } else if (notificationDate.getTime() >= yesterday.getTime()) {
    return '昨天';
  } else if (notificationDate.getTime() >= thisWeek.getTime()) {
    return '本周';
  } else {
    return '更早';
  }
}

export function NotificationList() {
  const { notifications, isLoading, markAsRead, markAllAsRead, unreadCount } = useNotifications();

  const groupedNotifications = useMemo(() => {
    const groups: Record<string, Notification[]> = {};
    const sorted = [...notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    for (const notification of sorted) {
      const group = getDateGroup(notification.createdAt.toString());
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(notification);
    }

    return groups;
  }, [notifications]);

  const groupOrder = ['今天', '昨天', '本周', '更早'];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <p className="text-muted-foreground">暂无通知</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">通知</h2>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">{unreadCount} 条未读</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="text-sm text-primary hover:underline font-medium"
          >
            全部标为已读
          </button>
        )}
      </div>

      <div className="space-y-6">
        {groupOrder.map((group) => {
          const items = groupedNotifications[group];
          if (!items || items.length === 0) return null;

          return (
            <div key={group}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 sticky top-0 bg-background py-2">
                {group}
              </h3>
              <div className="space-y-2">
                {items.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

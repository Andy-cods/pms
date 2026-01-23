'use client';

import { useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '@/hooks/use-notifications';
import { NotificationTypeLabels, type Notification } from '@/lib/api/notifications';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const router = useRouter();
  const { data: unreadData } = useUnreadCount();
  const { data, isLoading } = useNotifications({ limit: 10 });
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const unreadCount = unreadData?.count ?? 0;
  // Get only the first page for the bell dropdown
  const notifications = data?.pages[0]?.notifications ?? [];

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if not already
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }
    // Navigate to the link if available
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    markAllAsRead.mutate();
  };

  const getNotificationIcon = (type: Notification['type']) => {
    // Different icons based on notification type could be added here
    return null;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Thông báo</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <div className="flex items-center justify-between px-2">
          <DropdownMenuLabel>Thông báo</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col gap-1 p-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Không có thông báo</p>
            </div>
          ) : (
            <div className="p-1">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    'flex flex-col items-start gap-1 p-3 cursor-pointer',
                    !notification.isRead && 'bg-muted/50'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between w-full gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs shrink-0">
                          {NotificationTypeLabels[notification.type]}
                        </Badge>
                        {!notification.isRead && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-sm font-medium mt-1 line-clamp-1">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.content}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </p>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-center text-primary font-medium"
          onClick={() => router.push('/dashboard/notifications')}
        >
          Xem tất cả thông báo
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

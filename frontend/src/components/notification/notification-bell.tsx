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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-lg hover:bg-accent/80"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center',
                'rounded-full bg-[var(--apple-red)] px-1 text-[10px] font-medium text-white',
                'animate-in zoom-in-50 duration-200'
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          <span className="sr-only">Thong bao</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 rounded-xl p-0 overflow-hidden"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">
            Thong bao
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10 rounded-lg"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
            >
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              Doc tat ca
            </Button>
          )}
        </div>

        {/* Notification List */}
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="space-y-1 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col gap-2 p-3 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-16 rounded-md" />
                    <Skeleton className="h-2 w-2 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-full rounded" />
                  <Skeleton className="h-3 w-1/4 rounded" />
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 mb-3">
                <Bell className="h-6 w-6 opacity-50" />
              </div>
              <p className="text-sm font-medium">Khong co thong bao</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                Ban se nhan thong bao o day
              </p>
            </div>
          ) : (
            <div className="p-1.5">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  className={cn(
                    'flex w-full flex-col items-start gap-1.5 p-3 rounded-xl text-left transition-colors',
                    'hover:bg-accent/60',
                    !notification.isRead && 'bg-accent/40'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-5 rounded-md font-medium"
                    >
                      {NotificationTypeLabels[notification.type]}
                    </Badge>
                    {!notification.isRead && (
                      <span className="h-2 w-2 rounded-full bg-[var(--apple-blue)] shrink-0" />
                    )}
                  </div>
                  <p className="text-sm font-medium leading-snug line-clamp-1">
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {notification.content}
                  </p>
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border/50">
          <button
            className="w-full py-3 text-sm font-medium text-primary hover:bg-accent/50 transition-colors"
            onClick={() => router.push('/dashboard/notifications')}
          >
            Xem tat ca thong bao
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

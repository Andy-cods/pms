'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Bell,
  CheckCheck,
  Settings,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/hooks/use-notifications';
import {
  NotificationTypeLabels,
  NotificationPreferenceLabels,
  type Notification,
  type NotificationPreferences,
} from '@/lib/api/notifications';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const router = useRouter();
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useNotifications({ unreadOnly: showUnreadOnly });
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const { data: preferences, isLoading: prefsLoading } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();

  // Flatten pages into single array
  const notifications = data?.pages.flatMap((page) => page.notifications) ?? [];
  const totalUnread = data?.pages[0]?.unreadCount ?? 0;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  const handlePreferenceChange = (
    key: keyof NotificationPreferences,
    channel: 'inApp' | 'telegram',
    value: boolean
  ) => {
    if (!preferences) return;
    updatePreferences.mutate({
      [key]: {
        ...preferences[key],
        [channel]: value,
      },
    });
  };

  return (
    <div className="container max-w-4xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Thông báo</h1>
          <p className="text-muted-foreground">
            {totalUnread > 0
              ? `Bạn có ${totalUnread} thông báo chưa đọc`
              : 'Không có thông báo mới'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Cài đặt
          </Button>
          {totalUnread > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Lọc:</span>
            </div>
            <Tabs
              value={showUnreadOnly ? 'unread' : 'all'}
              onValueChange={(v) => setShowUnreadOnly(v === 'unread')}
            >
              <TabsList>
                <TabsTrigger value="all">Tất cả</TabsTrigger>
                <TabsTrigger value="unread">
                  Chưa đọc
                  {totalUnread > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {totalUnread}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Bell className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Không có thông báo</p>
              <p className="text-sm">
                {showUnreadOnly
                  ? 'Bạn đã đọc tất cả thông báo'
                  : 'Thông báo mới sẽ xuất hiện ở đây'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 cursor-pointer hover:bg-muted/50 transition-colors',
                    !notification.isRead && 'bg-muted/30'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full mt-2 shrink-0',
                        notification.isRead ? 'bg-transparent' : 'bg-primary'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {NotificationTypeLabels[notification.type]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: vi,
                          })}
                        </span>
                      </div>
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.content}
                      </p>
                      {notification.readAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Đã đọc lúc{' '}
                          {format(new Date(notification.readAt), 'HH:mm dd/MM/yyyy', {
                            locale: vi,
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More */}
          {hasNextPage && (
            <div className="p-4 text-center border-t">
              <Button
                variant="ghost"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? 'Đang tải...' : 'Xem thêm'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cài đặt thông báo</DialogTitle>
            <DialogDescription>
              Tùy chỉnh cách bạn nhận thông báo
            </DialogDescription>
          </DialogHeader>

          {prefsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-1/3" />
                  <div className="flex gap-4">
                    <Skeleton className="h-6 w-10" />
                    <Skeleton className="h-6 w-10" />
                  </div>
                </div>
              ))}
            </div>
          ) : preferences ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="grid grid-cols-3 gap-4 text-sm font-medium text-muted-foreground">
                <div></div>
                <div className="text-center">Trong app</div>
                <div className="text-center">Telegram</div>
              </div>

              {/* Preference rows */}
              {(Object.keys(preferences) as Array<keyof NotificationPreferences>).map(
                (key) => (
                  <div
                    key={key}
                    className="grid grid-cols-3 gap-4 items-center"
                  >
                    <Label className="text-sm">
                      {NotificationPreferenceLabels[key]}
                    </Label>
                    <div className="flex justify-center">
                      <Switch
                        checked={preferences[key].inApp}
                        onCheckedChange={(checked) =>
                          handlePreferenceChange(key, 'inApp', checked)
                        }
                        disabled={updatePreferences.isPending}
                      />
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={preferences[key].telegram}
                        onCheckedChange={(checked) =>
                          handlePreferenceChange(key, 'telegram', checked)
                        }
                        disabled={updatePreferences.isPending}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

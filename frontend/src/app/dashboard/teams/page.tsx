'use client';

import { useState, useMemo } from 'react';
import { Users, Search, ShieldAlert, RefreshCcw } from 'lucide-react';
import { useAdminUsers } from '@/hooks/use-admin-users';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { UserRole, UserRoleLabels } from '@/types';
import { cn } from '@/lib/utils';

const roleOptions: { value: UserRole | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Tất cả vai trò' },
  { value: UserRole.PM, label: UserRoleLabels[UserRole.PM] },
  { value: UserRole.NVKD, label: UserRoleLabels[UserRole.NVKD] },
  { value: UserRole.PLANNER, label: UserRoleLabels[UserRole.PLANNER] },
  { value: UserRole.ACCOUNT, label: UserRoleLabels[UserRole.ACCOUNT] },
  { value: UserRole.CONTENT, label: UserRoleLabels[UserRole.CONTENT] },
  { value: UserRole.DESIGN, label: UserRoleLabels[UserRole.DESIGN] },
  { value: UserRole.MEDIA, label: UserRoleLabels[UserRole.MEDIA] },
  { value: UserRole.TECHNICAL, label: UserRoleLabels[UserRole.TECHNICAL] },
  { value: UserRole.ADMIN, label: UserRoleLabels[UserRole.ADMIN] },
  { value: UserRole.SUPER_ADMIN, label: UserRoleLabels[UserRole.SUPER_ADMIN] },
];

export default function TeamsPage() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<UserRole | 'ALL'>('ALL');

  const { data, isLoading, isError, refetch, isFetching } = useAdminUsers({
    search: search || undefined,
    role: role === 'ALL' ? undefined : role,
    isActive: true,
    limit: 200,
  });

  const users = useMemo(() => data?.users ?? [], [data]);

  const renderSkeleton = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (isError) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-2 text-red-500">
          <ShieldAlert className="h-5 w-5" />
          <p className="font-medium">
            Không thể tải danh sách thành viên. Có thể bạn không có quyền truy cập.
          </p>
        </div>
        <Button variant="secondary" onClick={() => refetch()} className="gap-2">
          <RefreshCcw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Tổ chức</p>
          <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            Đội ngũ
          </h1>
          <p className="text-muted-foreground">
            Danh bạ thành viên nội bộ, lọc theo vai trò để tìm người phù hợp.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCcw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo tên hoặc email"
            className="pl-10 h-10 rounded-xl"
          />
        </div>
        <Select
          value={role}
          onValueChange={(value) => setRole(value as UserRole | 'ALL')}
        >
          <SelectTrigger className="w-[220px] h-10 rounded-xl">
            <SelectValue placeholder="Chọn vai trò" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {roleOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        renderSkeleton()
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => {
            const initials = user.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <Card key={user.id} className="border-border/70 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center gap-3 pb-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar || undefined} alt={user.name} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{user.name}</CardTitle>
                      {!user.isActive && (
                        <Badge variant="secondary" className="text-xs">Ngưng</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {UserRoleLabels[user.role as UserRole] || user.role}
                  </Badge>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-1">
                  <p>ID: {user.id}</p>
                  <p>
                    Lần đăng nhập cuối:&nbsp;
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleString('vi-VN')
                      : 'Chưa có'}
                  </p>
                </CardContent>
              </Card>
            );
          })}

          {users.length === 0 && !isLoading && (
            <Card className="col-span-full border-dashed border-2">
              <CardContent className="py-10 text-center text-muted-foreground">
                Không tìm thấy thành viên phù hợp.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

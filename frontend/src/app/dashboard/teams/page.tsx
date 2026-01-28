'use client';

import { useState, useMemo } from 'react';
import { Users, Search, ShieldAlert, RefreshCcw, Shield } from 'lucide-react';
import { useUsersWorkload } from '@/hooks/use-admin-users';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SegmentControl } from '@/components/ui/segment-control';
import { TeamAllMembers } from '@/components/teams/team-all-members';
import { TeamByProject } from '@/components/teams/team-by-project';
import { TeamByDepartment } from '@/components/teams/team-by-department';
import { PermissionMatrix } from '@/components/teams/permission-matrix';
import { UserRole, UserRoleLabels } from '@/types';
import { cn } from '@/lib/utils';

type TabValue = 'all' | 'by-project' | 'by-department';

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
  const [tab, setTab] = useState<TabValue>('all');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [showPermMatrix, setShowPermMatrix] = useState(false);

  const { user: currentUser } = useAuth();
  const { data: workloadUsers, isLoading, isError, refetch, isFetching } = useUsersWorkload();

  const filteredUsers = useMemo(() => {
    if (!workloadUsers) return [];
    let result = workloadUsers;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    if (roleFilter !== 'ALL') {
      result = result.filter((u) => u.role === roleFilter);
    }
    return result;
  }, [workloadUsers, search, roleFilter]);

  const totalMembers = workloadUsers?.length ?? 0;
  const activeMembers = workloadUsers?.filter((u) => u.isActive).length ?? 0;
  const uniqueRoles = new Set(workloadUsers?.map((u) => u.role) ?? []).size;

  const tabItems = [
    { value: 'all', label: 'Tất cả', count: totalMembers },
    { value: 'by-project', label: 'Theo dự án' },
    { value: 'by-department', label: 'Theo phòng ban' },
  ];

  const renderSkeleton = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-2 w-full" />
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Tổ chức</p>
          <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            Đội ngũ
          </h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{totalMembers} thành viên</span>
            <span>·</span>
            <span>{activeMembers} đang hoạt động</span>
            <span>·</span>
            <span>{uniqueRoles} vai trò</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPermMatrix(!showPermMatrix)}
            className="gap-2"
          >
            <Shield className="h-4 w-4" />
            Bảng quyền
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCcw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Permission matrix (collapsible) */}
      {showPermMatrix && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ma trận quyền hạn</CardTitle>
          </CardHeader>
          <CardContent>
            <PermissionMatrix />
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SegmentControl
          value={tab}
          onChange={(v) => setTab(v as TabValue)}
          items={tabItems}
        />

        {/* Search + filter (only for "all" tab) */}
        {tab === 'all' && (
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm..."
                className="pl-9 h-9 w-[200px] rounded-xl"
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={(value) => setRoleFilter(value as UserRole | 'ALL')}
            >
              <SelectTrigger className="w-[180px] h-9 rounded-xl">
                <SelectValue placeholder="Vai trò" />
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
        )}
      </div>

      {/* Tab Content */}
      {isLoading ? (
        renderSkeleton()
      ) : (
        <>
          {tab === 'all' && (
            <TeamAllMembers
              users={filteredUsers}
              currentUserRole={currentUser?.role}
            />
          )}
          {tab === 'by-project' && <TeamByProject />}
          {tab === 'by-department' && (
            <TeamByDepartment users={filteredUsers} />
          )}
        </>
      )}
    </div>
  );
}

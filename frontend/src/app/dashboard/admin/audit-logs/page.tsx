'use client';

import { useState, useMemo } from 'react';
import {
  History,
  Download,
  Eye,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  User,
  Folder,
  CheckSquare,
  FileText,
  Settings,
  LogIn,
  LogOut,
  Key,
  Plus,
  Pencil,
  Trash,
  Check,
  XCircle,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  useAuditLogs,
  useAuditLogActions,
  useAuditLogEntityTypes,
} from '@/hooks/use-admin';
import { useAdminUsers } from '@/hooks/use-admin-users';
import { type AuditLog, type AuditLogsQueryParams } from '@/lib/api/admin';
import { cn } from '@/lib/utils';

// Action type labels in Vietnamese
const actionLabels: Record<string, string> = {
  LOGIN: 'Dang nhap',
  LOGOUT: 'Dang xuat',
  PASSWORD_CHANGE: 'Doi mat khau',
  USER_CREATE: 'Tao nguoi dung',
  USER_UPDATE: 'Cap nhat nguoi dung',
  USER_DELETE: 'Xoa nguoi dung',
  USER_ACTIVATE: 'Kich hoat nguoi dung',
  USER_DEACTIVATE: 'Vo hieu hoa nguoi dung',
  PROJECT_CREATE: 'Tao du an',
  PROJECT_UPDATE: 'Cap nhat du an',
  PROJECT_DELETE: 'Xoa du an',
  PROJECT_ARCHIVE: 'Luu tru du an',
  TASK_CREATE: 'Tao task',
  TASK_UPDATE: 'Cap nhat task',
  TASK_DELETE: 'Xoa task',
  TASK_COMPLETE: 'Hoan thanh task',
  SETTINGS_UPDATE: 'Cap nhat cai dat',
  FILE_UPLOAD: 'Tai file len',
  FILE_DELETE: 'Xoa file',
  APPROVAL_CREATE: 'Tao yeu cau phe duyet',
  APPROVAL_APPROVE: 'Phe duyet',
  APPROVAL_REJECT: 'Tu choi',
  CLIENT_CREATE: 'Tao khach hang',
  CLIENT_UPDATE: 'Cap nhat khach hang',
  CLIENT_DELETE: 'Xoa khach hang',
};

// Entity type labels in Vietnamese
const entityLabels: Record<string, string> = {
  User: 'Nguoi dung',
  Project: 'Du an',
  Task: 'Task',
  File: 'File',
  Approval: 'Phe duyet',
  Client: 'Khach hang',
  SystemSetting: 'Cai dat',
  Session: 'Phien',
};

// Action icons mapping
const actionIcons: Record<string, React.ElementType> = {
  LOGIN: LogIn,
  LOGOUT: LogOut,
  PASSWORD_CHANGE: Key,
  USER_CREATE: Plus,
  USER_UPDATE: Pencil,
  USER_DELETE: Trash,
  USER_ACTIVATE: Check,
  USER_DEACTIVATE: XCircle,
  PROJECT_CREATE: Plus,
  PROJECT_UPDATE: Pencil,
  PROJECT_DELETE: Trash,
  TASK_CREATE: Plus,
  TASK_UPDATE: Pencil,
  TASK_DELETE: Trash,
  TASK_COMPLETE: Check,
  SETTINGS_UPDATE: Settings,
  FILE_UPLOAD: FileText,
  FILE_DELETE: Trash,
  APPROVAL_CREATE: Plus,
  APPROVAL_APPROVE: Check,
  APPROVAL_REJECT: XCircle,
  CLIENT_CREATE: Plus,
  CLIENT_UPDATE: Pencil,
  CLIENT_DELETE: Trash,
};

// Entity type icons
const entityIcons: Record<string, React.ElementType> = {
  User: User,
  Project: Folder,
  Task: CheckSquare,
  File: FileText,
  Approval: Check,
  Client: Building2,
  SystemSetting: Settings,
  Session: LogIn,
};

// Action colors
function getActionStyle(action: string): { bg: string; text: string; icon: string } {
  if (action.includes('LOGIN') || action.includes('APPROVE') || action.includes('ACTIVATE') || action.includes('COMPLETE')) {
    return { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', icon: 'text-emerald-500' };
  }
  if (action.includes('LOGOUT')) {
    return { bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', icon: 'text-gray-500' };
  }
  if (action.includes('CREATE')) {
    return { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', icon: 'text-blue-500' };
  }
  if (action.includes('UPDATE')) {
    return { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', icon: 'text-amber-500' };
  }
  if (action.includes('DELETE') || action.includes('REJECT') || action.includes('DEACTIVATE')) {
    return { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', icon: 'text-red-500' };
  }
  return { bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', icon: 'text-gray-500' };
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export default function AuditLogsPage() {
  const [filters, setFilters] = useState<AuditLogsQueryParams>({
    page: 1,
    limit: 20,
  });
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Queries
  const { data: logsData, isLoading, refetch, isFetching } = useAuditLogs(filters);
  const { data: actionsData } = useAuditLogActions();
  const { data: entityTypesData } = useAuditLogEntityTypes();
  const { data: usersData } = useAdminUsers({ limit: 100 });

  // Derived state
  const logs = logsData?.logs || [];
  const totalPages = logsData?.totalPages || 1;
  const currentPage = filters.page || 1;

  // Handle filter changes
  const handleFilterChange = (key: keyof AuditLogsQueryParams, value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: 1, // Reset to first page on filter change
    }));
  };

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    setFilters((prev) => ({
      ...prev,
      startDate: range.from ? format(range.from, 'yyyy-MM-dd') : undefined,
      endDate: range.to ? format(range.to, 'yyyy-MM-dd') : undefined,
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 20 });
    setDateRange({ from: undefined, to: undefined });
  };

  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.userId ||
      filters.action ||
      filters.entityType ||
      filters.startDate ||
      filters.endDate
    );
  }, [filters]);

  // Export to CSV
  const exportToCSV = () => {
    if (!logs.length) return;

    const headers = [
      'Thoi gian',
      'Nguoi dung',
      'Email',
      'Hanh dong',
      'Doi tuong',
      'ID Doi tuong',
      'IP',
    ];
    const rows = logs.map((log) => [
      format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: vi }),
      log.user?.name || 'He thong',
      log.user?.email || '',
      actionLabels[log.action] || log.action,
      entityLabels[log.entityType] || log.entityType,
      log.entityId || '',
      log.ipAddress || '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const formatRelativeTime = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
    } catch {
      return date;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
        </div>

        {/* Filter Skeleton */}
        <div className="flex gap-3 flex-wrap">
          <Skeleton className="h-11 w-64 rounded-xl" />
          <Skeleton className="h-11 w-40 rounded-xl" />
          <Skeleton className="h-11 w-40 rounded-xl" />
          <Skeleton className="h-11 w-40 rounded-xl" />
        </div>

        {/* Timeline Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nhat ky hoat dong</h1>
          <p className="text-muted-foreground mt-1">
            Theo doi {logsData?.total || 0} hoat dong trong he thong
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-10 w-10 rounded-xl border-border/50"
          >
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          </Button>
          <Button
            variant="outline"
            onClick={exportToCSV}
            disabled={!logs.length}
            className="h-10 rounded-xl border-border/50"
          >
            <Download className="h-4 w-4 mr-2" />
            Xuat CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* User Filter */}
        <Select
          value={filters.userId || 'all'}
          onValueChange={(value) =>
            handleFilterChange('userId', value === 'all' ? undefined : value)
          }
        >
          <SelectTrigger className="w-[180px] h-11 rounded-xl bg-surface border-border/50">
            <User className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Nguoi dung" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tat ca nguoi dung</SelectItem>
            {usersData?.users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Action Filter */}
        <Select
          value={filters.action || 'all'}
          onValueChange={(value) =>
            handleFilterChange('action', value === 'all' ? undefined : value)
          }
        >
          <SelectTrigger className="w-[180px] h-11 rounded-xl bg-surface border-border/50">
            <SelectValue placeholder="Hanh dong" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tat ca hanh dong</SelectItem>
            {actionsData?.actions.map((action) => (
              <SelectItem key={action} value={action}>
                {actionLabels[action] || action}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Entity Type Filter */}
        <Select
          value={filters.entityType || 'all'}
          onValueChange={(value) =>
            handleFilterChange('entityType', value === 'all' ? undefined : value)
          }
        >
          <SelectTrigger className="w-[160px] h-11 rounded-xl bg-surface border-border/50">
            <SelectValue placeholder="Loai" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tat ca loai</SelectItem>
            {entityTypesData?.entityTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {entityLabels[type] || type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'h-11 rounded-xl bg-surface border-border/50 justify-start text-left font-normal',
                !dateRange.from && 'text-muted-foreground'
              )}
            >
              <Calendar className="h-4 w-4 mr-2" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'dd/MM/yy', { locale: vi })} -{' '}
                    {format(dateRange.to, 'dd/MM/yy', { locale: vi })}
                  </>
                ) : (
                  format(dateRange.from, 'dd/MM/yyyy', { locale: vi })
                )
              ) : (
                'Chon ngay'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-xl" align="start">
            <CalendarComponent
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) =>
                handleDateRangeChange({
                  from: range?.from,
                  to: range?.to,
                })
              }
              locale={vi}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-11 px-4 rounded-xl text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-2" />
            Xoa bo loc
          </Button>
        )}
      </div>

      {/* Timeline View */}
      {logs.length > 0 ? (
        <div className="space-y-1">
          {logs.map((log, index) => {
            const ActionIcon = actionIcons[log.action] || History;
            const EntityIcon = entityIcons[log.entityType] || FileText;
            const actionStyle = getActionStyle(log.action);
            const isLast = index === logs.length - 1;

            return (
              <div
                key={log.id}
                className="group relative flex gap-4 py-4 hover:bg-surface/50 px-4 -mx-4 rounded-xl cursor-pointer transition-colors"
                onClick={() => setSelectedLog(log)}
              >
                {/* Timeline line */}
                {!isLast && (
                  <div className="absolute left-[30px] top-[60px] bottom-0 w-px bg-border/50" />
                )}

                {/* Avatar/Icon */}
                <div className="relative z-10 flex-shrink-0">
                  {log.user ? (
                    <Avatar className="h-12 w-12 ring-2 ring-background">
                      <AvatarImage src={log.user.avatar || undefined} />
                      <AvatarFallback className="text-sm bg-surface">
                        {getInitials(log.user.name)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-surface flex items-center justify-center ring-2 ring-background">
                      <Settings className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  {/* Action icon badge */}
                  <div
                    className={cn(
                      'absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ring-2 ring-background',
                      actionStyle.bg
                    )}
                  >
                    <ActionIcon className={cn('h-3 w-3', actionStyle.icon)} />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 py-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium">
                        <span className="text-foreground">
                          {log.user?.name || 'He thong'}
                        </span>
                        <span className="text-muted-foreground font-normal mx-1.5">
                          da
                        </span>
                        <span className={actionStyle.text}>
                          {(actionLabels[log.action] || log.action).toLowerCase()}
                        </span>
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="secondary"
                          className="font-normal text-xs px-2 py-0.5 rounded-md bg-surface"
                        >
                          <EntityIcon className="h-3 w-3 mr-1" />
                          {entityLabels[log.entityType] || log.entityType}
                        </Badge>
                        {log.entityId && (
                          <span className="text-xs text-muted-foreground font-mono">
                            #{log.entityId.slice(0, 8)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(log.createdAt)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center mb-5">
            <History className="h-9 w-9 text-muted-foreground" />
          </div>
          <p className="text-xl font-medium text-foreground">Khong co nhat ky</p>
          <p className="text-sm text-muted-foreground mt-2 text-center max-w-md">
            Chua co hoat dong nao duoc ghi nhan hoac khong tim thay ket qua phu hop voi bo loc.
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="mt-5 rounded-xl"
            >
              <X className="h-4 w-4 mr-2" />
              Xoa bo loc
            </Button>
          )}
        </div>
      )}

      {/* Pagination */}
      {logs.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            Trang {currentPage} / {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="h-9 rounded-xl border-border/50"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Truoc
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="h-9 rounded-xl border-border/50"
            >
              Sau
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="rounded-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiet nhat ky</DialogTitle>
            <DialogDescription>
              Thong tin chi tiet ve hoat dong nay
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6">
              {/* Basic Info Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Thoi gian"
                  value={format(new Date(selectedLog.createdAt), 'dd/MM/yyyy HH:mm:ss', {
                    locale: vi,
                  })}
                />
                <DetailItem
                  label="Nguoi thuc hien"
                  value={
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={selectedLog.user?.avatar || undefined} />
                        <AvatarFallback className="text-xs">
                          {selectedLog.user ? getInitials(selectedLog.user.name) : 'SY'}
                        </AvatarFallback>
                      </Avatar>
                      <span>{selectedLog.user?.name || 'He thong'}</span>
                    </div>
                  }
                />
                <DetailItem
                  label="Hanh dong"
                  value={
                    <Badge className={cn('font-medium', getActionStyle(selectedLog.action).bg, getActionStyle(selectedLog.action).text)}>
                      {actionLabels[selectedLog.action] || selectedLog.action}
                    </Badge>
                  }
                />
                <DetailItem
                  label="Doi tuong"
                  value={`${entityLabels[selectedLog.entityType] || selectedLog.entityType}${selectedLog.entityId ? ` (${selectedLog.entityId})` : ''}`}
                />
                <DetailItem
                  label="Dia chi IP"
                  value={
                    <span className="font-mono text-sm">
                      {selectedLog.ipAddress || 'Khong xac dinh'}
                    </span>
                  }
                />
                <DetailItem
                  label="Trinh duyet"
                  value={
                    <span className="text-sm text-muted-foreground line-clamp-2">
                      {selectedLog.userAgent || 'Khong xac dinh'}
                    </span>
                  }
                />
              </div>

              {/* Value Changes */}
              {(selectedLog.oldValue || selectedLog.newValue) && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Thay doi du lieu</Label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {selectedLog.oldValue && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-red-600 dark:text-red-400">
                          Gia tri cu
                        </p>
                        <ScrollArea className="h-40 rounded-xl border border-border/50 bg-surface p-3">
                          <pre className="text-xs font-mono">
                            {JSON.stringify(selectedLog.oldValue, null, 2)}
                          </pre>
                        </ScrollArea>
                      </div>
                    )}
                    {selectedLog.newValue && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                          Gia tri moi
                        </p>
                        <ScrollArea className="h-40 rounded-xl border border-border/50 bg-surface p-3">
                          <pre className="text-xs font-mono">
                            {JSON.stringify(selectedLog.newValue, null, 2)}
                          </pre>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Detail Item Component
function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </Label>
      <div className="text-sm">{value}</div>
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Eye,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  useAuditLogs,
  useAuditLogActions,
  useAuditLogEntityTypes,
} from '@/hooks/use-admin';
import { useAdminUsers } from '@/hooks/use-admin-users';
import { type AuditLog, type AuditLogsQueryParams } from '@/lib/api/admin';

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
  SystemSetting: 'Cai dat he thong',
  Session: 'Phien dang nhap',
};

// Action badge colors
const actionColors: Record<string, string> = {
  LOGIN: 'bg-green-100 text-green-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
  CREATE: 'bg-blue-100 text-blue-800',
  UPDATE: 'bg-yellow-100 text-yellow-800',
  DELETE: 'bg-red-100 text-red-800',
  APPROVE: 'bg-green-100 text-green-800',
  REJECT: 'bg-red-100 text-red-800',
};

function getActionColor(action: string): string {
  for (const [key, color] of Object.entries(actionColors)) {
    if (action.includes(key)) return color;
  }
  return 'bg-gray-100 text-gray-800';
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Queries
  const { data: logsData, isLoading, refetch } = useAuditLogs(filters);
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-16" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nhat ky hoat dong</h1>
          <p className="text-muted-foreground">
            Theo doi tat ca hoat dong trong he thong
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={exportToCSV} disabled={!logs.length}>
            <Download className="mr-2 h-4 w-4" />
            Xuat CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Bo loc</CardTitle>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Xoa bo loc
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* User filter */}
            <div className="space-y-2">
              <Label>Nguoi dung</Label>
              <Select
                value={filters.userId || 'all'}
                onValueChange={(value) =>
                  handleFilterChange('userId', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tat ca nguoi dung" />
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
            </div>

            {/* Action filter */}
            <div className="space-y-2">
              <Label>Hanh dong</Label>
              <Select
                value={filters.action || 'all'}
                onValueChange={(value) =>
                  handleFilterChange('action', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tat ca hanh dong" />
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
            </div>

            {/* Entity type filter */}
            <div className="space-y-2">
              <Label>Loai doi tuong</Label>
              <Select
                value={filters.entityType || 'all'}
                onValueChange={(value) =>
                  handleFilterChange('entityType', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tat ca loai" />
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
            </div>

            {/* Date range filter */}
            <div className="space-y-2">
              <Label>Khoang thoi gian</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
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
                <PopoverContent className="w-auto p-0" align="start">
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sach nhat ky ({logsData?.total || 0})</CardTitle>
          <CardDescription>
            Xem chi tiet hoat dong bang cach click vao dong
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <History className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Khong co nhat ky</h3>
                <p className="mt-2 text-muted-foreground">
                  Chua co hoat dong nao duoc ghi nhan hoac khong tim thay ket qua.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Thoi gian</TableHead>
                      <TableHead className="w-[200px]">Nguoi dung</TableHead>
                      <TableHead className="w-[160px]">Hanh dong</TableHead>
                      <TableHead className="w-[140px]">Doi tuong</TableHead>
                      <TableHead>Chi tiet</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow
                        key={log.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedLog(log)}
                      >
                        <TableCell className="font-mono text-sm">
                          {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm', {
                            locale: vi,
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={log.user?.avatar || undefined} />
                              <AvatarFallback className="text-xs">
                                {log.user ? getInitials(log.user.name) : 'SY'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {log.user?.name || 'He thong'}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {log.user?.email || ''}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={getActionColor(log.action)}
                          >
                            {actionLabels[log.action] || log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {entityLabels[log.entityType] || log.entityType}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <p className="truncate text-sm text-muted-foreground">
                            {log.entityId ? `ID: ${log.entityId.slice(0, 8)}...` : '-'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(log);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Trang {currentPage} / {totalPages} (Tong: {logsData?.total || 0})
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Truoc
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    Sau
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiet nhat ky</DialogTitle>
            <DialogDescription>
              Thong tin chi tiet ve hoat dong nay
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Thoi gian</Label>
                  <p className="font-medium">
                    {format(new Date(selectedLog.createdAt), 'dd/MM/yyyy HH:mm:ss', {
                      locale: vi,
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Nguoi thuc hien</Label>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={selectedLog.user?.avatar || undefined} />
                      <AvatarFallback className="text-xs">
                        {selectedLog.user ? getInitials(selectedLog.user.name) : 'SY'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {selectedLog.user?.name || 'He thong'}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Hanh dong</Label>
                  <Badge className={getActionColor(selectedLog.action)}>
                    {actionLabels[selectedLog.action] || selectedLog.action}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Doi tuong</Label>
                  <p className="font-medium">
                    {entityLabels[selectedLog.entityType] || selectedLog.entityType}
                    {selectedLog.entityId && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({selectedLog.entityId})
                      </span>
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Dia chi IP</Label>
                  <p className="font-mono text-sm">{selectedLog.ipAddress || 'Khong xac dinh'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Trinh duyet</Label>
                  <p className="text-sm text-muted-foreground truncate">
                    {selectedLog.userAgent || 'Khong xac dinh'}
                  </p>
                </div>
              </div>

              {/* Value Changes */}
              {(selectedLog.oldValue || selectedLog.newValue) && (
                <div className="space-y-3">
                  <Label className="text-muted-foreground">Thay doi du lieu</Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    {selectedLog.oldValue && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-red-600">Gia tri cu:</p>
                        <ScrollArea className="h-40 rounded-md border bg-muted/30 p-3">
                          <pre className="text-xs">
                            {JSON.stringify(selectedLog.oldValue, null, 2)}
                          </pre>
                        </ScrollArea>
                      </div>
                    )}
                    {selectedLog.newValue && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-green-600">Gia tri moi:</p>
                        <ScrollArea className="h-40 rounded-md border bg-muted/30 p-3">
                          <pre className="text-xs">
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

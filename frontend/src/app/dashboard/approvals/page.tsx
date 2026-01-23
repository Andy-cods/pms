'use client';

import { useState } from 'react';
import {
  Search,
  ClipboardCheck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Check,
  X,
  MessageSquare,
} from 'lucide-react';

import { useApprovals, usePendingApprovals, useApprovalStats } from '@/hooks/use-approvals';
import { useAuth } from '@/hooks/use-auth';
import {
  type Approval,
  type ApprovalStatus,
  type ApprovalType,
  ApprovalStatusLabels,
  ApprovalStatusColors,
  ApprovalTypeLabels,
  ApprovalTypeColors,
  EscalationLevelLabels,
  EscalationLevelColors,
} from '@/lib/api/approvals';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ApprovalDetailModal } from '@/components/approval/approval-detail-modal';
import { ApprovalActionButtons } from '@/components/approval/approval-action-buttons';

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ApprovalType | 'all'>('all');
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);

  // Check if user can approve (NVKD, ADMIN, SUPER_ADMIN)
  const canApprove = ['NVKD', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role || '');

  const { data: stats } = useApprovalStats();
  const { data: pendingData, isLoading: pendingLoading } = usePendingApprovals();
  const { data, isLoading } = useApprovals({
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    limit: 50,
  });

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} ngày trước`;
    if (diffHours > 0) return `${diffHours} giờ trước`;
    return 'Vừa xong';
  };

  const getStatusIcon = (status: ApprovalStatus) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />;
      case 'CHANGES_REQUESTED':
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const renderApprovalTable = (approvals: Approval[] | undefined, showActions = false) => (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dự án</TableHead>
            <TableHead>Tiêu đề</TableHead>
            <TableHead>Loại</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Người gửi</TableHead>
            <TableHead>Thời gian</TableHead>
            <TableHead className="w-[150px]">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {approvals?.map((approval) => (
            <TableRow key={approval.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{approval.project.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {approval.project.code}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{approval.title}</div>
                  {approval.description && (
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {approval.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={ApprovalTypeColors[approval.type]}>
                  {ApprovalTypeLabels[approval.type]}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge className={ApprovalStatusColors[approval.status]}>
                    {getStatusIcon(approval.status)}
                    <span className="ml-1">{ApprovalStatusLabels[approval.status]}</span>
                  </Badge>
                  {approval.escalationLevel > 0 && (
                    <span
                      className={`text-xs ${EscalationLevelColors[approval.escalationLevel]}`}
                    >
                      {EscalationLevelLabels[approval.escalationLevel]}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {approval.submittedBy.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">{approval.submittedBy.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatRelativeTime(approval.submittedAt)}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-muted-foreground">
                  {formatDate(approval.submittedAt)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedApprovalId(approval.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {showActions && approval.status === 'PENDING' && canApprove && (
                    <ApprovalActionButtons
                      approvalId={approval.id}
                      compact
                      onSuccess={() => {}}
                    />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Phê duyệt</h1>
          <p className="text-muted-foreground">Quản lý các yêu cầu phê duyệt</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đang chờ</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đã duyệt</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Từ chối</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Yêu cầu sửa</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.changesRequested}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue={canApprove ? 'pending' : 'all'} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            {canApprove && (
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="h-4 w-4" />
                Cần duyệt
                {pendingData && pendingData.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {pendingData.length}
                  </Badge>
                )}
              </TabsTrigger>
            )}
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="approved">Đã duyệt</TabsTrigger>
            <TabsTrigger value="rejected">Từ chối</TabsTrigger>
            <TabsTrigger value="changes">Yêu cầu sửa</TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as ApprovalType | 'all')}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                {Object.entries(ApprovalTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Pending approvals tab (for approvers) */}
        {canApprove && (
          <TabsContent value="pending" className="space-y-4">
            {pendingLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : pendingData && pendingData.length > 0 ? (
              renderApprovalTable(pendingData, true)
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                  <h3 className="mt-4 text-lg font-medium">Không có yêu cầu chờ duyệt</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Tất cả yêu cầu đã được xử lý.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* All approvals tab */}
        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : data?.approvals && data.approvals.length > 0 ? (
            renderApprovalTable(data.approvals)
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <ClipboardCheck className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Chưa có yêu cầu phê duyệt</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Các yêu cầu phê duyệt sẽ hiển thị ở đây.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Approved tab */}
        <TabsContent value="approved" className="space-y-4">
          <ApprovalFilteredList status="APPROVED" />
        </TabsContent>

        {/* Rejected tab */}
        <TabsContent value="rejected" className="space-y-4">
          <ApprovalFilteredList status="REJECTED" />
        </TabsContent>

        {/* Changes requested tab */}
        <TabsContent value="changes" className="space-y-4">
          <ApprovalFilteredList status="CHANGES_REQUESTED" />
        </TabsContent>
      </Tabs>

      {/* Pagination info */}
      {data && data.total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Hiển thị {data.approvals.length} / {data.total} yêu cầu
          </span>
          <span>
            Trang {data.page} / {data.totalPages}
          </span>
        </div>
      )}

      {/* Detail Modal */}
      {selectedApprovalId && (
        <ApprovalDetailModal
          approvalId={selectedApprovalId}
          open={!!selectedApprovalId}
          onClose={() => setSelectedApprovalId(null)}
        />
      )}
    </div>
  );
}

// Helper component for filtered lists
function ApprovalFilteredList({ status }: { status: ApprovalStatus }) {
  const { data, isLoading } = useApprovals({ status, limit: 50 });
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!data?.approvals || data.approvals.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <ClipboardCheck className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">
            Không có yêu cầu {ApprovalStatusLabels[status].toLowerCase()}
          </h3>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dự án</TableHead>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Người xử lý</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.approvals.map((approval) => (
              <TableRow key={approval.id}>
                <TableCell>
                  <div className="font-medium">{approval.project.name}</div>
                </TableCell>
                <TableCell>{approval.title}</TableCell>
                <TableCell>
                  <Badge className={ApprovalTypeColors[approval.type]}>
                    {ApprovalTypeLabels[approval.type]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {approval.approvedBy ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {approval.approvedBy.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{approval.approvedBy.name}</span>
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(approval.respondedAt)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedApprovalId(approval.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {selectedApprovalId && (
        <ApprovalDetailModal
          approvalId={selectedApprovalId}
          open={!!selectedApprovalId}
          onClose={() => setSelectedApprovalId(null)}
        />
      )}
    </>
  );
}

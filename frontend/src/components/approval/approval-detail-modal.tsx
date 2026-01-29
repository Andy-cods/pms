'use client';

import { useState } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Download,
  User,
  Calendar,
  MessageSquare,
} from 'lucide-react';

import { useApproval } from '@/hooks/use-approvals';
import { useAuth } from '@/hooks/use-auth';
import {
  ApprovalStatusLabels,
  ApprovalStatusColors,
  ApprovalTypeLabels,
  EscalationLevelLabels,
  EscalationLevelColors,
  type ApprovalStatus,
} from '@/lib/api/approvals';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ApprovalActionButtons } from './approval-action-buttons';

interface ApprovalDetailModalProps {
  approvalId: string;
  open: boolean;
  onClose: () => void;
}

export function ApprovalDetailModal({
  approvalId,
  open,
  onClose,
}: ApprovalDetailModalProps) {
  const { user } = useAuth();
  const { data: approval, isLoading } = useApproval(approvalId);

  const canApprove = ['NVKD', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role || '');

  const getStatusIcon = (status: ApprovalStatus) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-5 w-5" />;
      case 'APPROVED':
        return <CheckCircle className="h-5 w-5" />;
      case 'REJECTED':
        return <XCircle className="h-5 w-5" />;
      case 'CHANGES_REQUESTED':
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Chi tiết yêu cầu phê duyệt</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : approval ? (
          <ScrollArea className="max-h-[calc(90vh-120px)]">
            <div className="space-y-6 pr-4">
              {/* Header Info */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{approval.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {approval.project.dealCode} - {approval.project.name}
                    </p>
                  </div>
                  <Badge className={ApprovalStatusColors[approval.status]}>
                    {getStatusIcon(approval.status)}
                    <span className="ml-1">{ApprovalStatusLabels[approval.status]}</span>
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{ApprovalTypeLabels[approval.type]}</Badge>
                  </div>
                  {approval.escalationLevel > 0 && (
                    <span
                      className={`flex items-center gap-1 ${EscalationLevelColors[approval.escalationLevel]}`}
                    >
                      <AlertCircle className="h-4 w-4" />
                      {EscalationLevelLabels[approval.escalationLevel]}
                    </span>
                  )}
                  {approval.deadline && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Deadline: {formatDate(approval.deadline)}
                    </span>
                  )}
                </div>
              </div>

              <Separator />

              {/* Description */}
              {approval.description && (
                <div>
                  <h4 className="font-medium mb-2">Mô tả</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {approval.description}
                  </p>
                </div>
              )}

              {/* Comment from approver */}
              {approval.comment && (
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Ghi chú từ người duyệt
                  </h4>
                  <p className="text-sm">{approval.comment}</p>
                </div>
              )}

              {/* Files */}
              {approval.files && approval.files.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Tệp đính kèm</h4>
                  <div className="space-y-2">
                    {approval.files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">{file.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* People */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-3">Người gửi</h4>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {approval.submittedBy.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{approval.submittedBy.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {approval.submittedBy.email}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(approval.submittedAt)}
                      </div>
                    </div>
                  </div>
                </div>

                {approval.approvedBy && (
                  <div>
                    <h4 className="font-medium mb-3">Người xử lý</h4>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {approval.approvedBy.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{approval.approvedBy.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(approval.respondedAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* History Timeline */}
              {approval.history && approval.history.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Lịch sử</h4>
                  <div className="space-y-3">
                    {approval.history.map((item, index) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                          {index < approval.history.length - 1 && (
                            <div className="w-px flex-1 bg-border" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="outline" className="text-xs">
                              {ApprovalStatusLabels[item.toStatus]}
                            </Badge>
                            <span className="text-muted-foreground">
                              bởi {item.changedBy.name}
                            </span>
                          </div>
                          {item.comment && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.comment}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(item.changedAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {approval.status === 'PENDING' && canApprove && (
                <>
                  <Separator />
                  <ApprovalActionButtons
                    approvalId={approval.id}
                    onSuccess={onClose}
                  />
                </>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Không tìm thấy yêu cầu phê duyệt
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

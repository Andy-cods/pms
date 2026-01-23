'use client';

import { useState } from 'react';
import { Check, X, MessageSquare, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  useApproveApproval,
  useRejectApproval,
  useRequestChangesApproval,
} from '@/hooks/use-approvals';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ApprovalActionButtonsProps {
  approvalId: string;
  compact?: boolean;
  onSuccess?: () => void;
}

export function ApprovalActionButtons({
  approvalId,
  compact = false,
  onSuccess,
}: ApprovalActionButtonsProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showChangesDialog, setShowChangesDialog] = useState(false);
  const [comment, setComment] = useState('');

  const approveAction = useApproveApproval();
  const rejectAction = useRejectApproval();
  const requestChangesAction = useRequestChangesApproval();

  const handleApprove = async () => {
    try {
      await approveAction.mutateAsync({ id: approvalId });
      toast.success('Đã phê duyệt thành công');
      onSuccess?.();
    } catch (error) {
      toast.error('Không thể phê duyệt. Vui lòng thử lại.');
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      await rejectAction.mutateAsync({
        id: approvalId,
        input: { comment: comment.trim() },
      });
      toast.success('Đã từ chối yêu cầu');
      setShowRejectDialog(false);
      setComment('');
      onSuccess?.();
    } catch (error) {
      toast.error('Không thể từ chối. Vui lòng thử lại.');
    }
  };

  const handleRequestChanges = async () => {
    if (!comment.trim()) {
      toast.error('Vui lòng nhập yêu cầu chỉnh sửa');
      return;
    }

    try {
      await requestChangesAction.mutateAsync({
        id: approvalId,
        input: { comment: comment.trim() },
      });
      toast.success('Đã gửi yêu cầu chỉnh sửa');
      setShowChangesDialog(false);
      setComment('');
      onSuccess?.();
    } catch (error) {
      toast.error('Không thể gửi yêu cầu. Vui lòng thử lại.');
    }
  };

  const isLoading =
    approveAction.isPending ||
    rejectAction.isPending ||
    requestChangesAction.isPending;

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                onClick={handleApprove}
                disabled={isLoading}
              >
                {approveAction.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Phê duyệt</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                onClick={() => setShowRejectDialog(true)}
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Từ chối</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-100"
                onClick={() => setShowChangesDialog(true)}
                disabled={isLoading}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Yêu cầu chỉnh sửa</TooltipContent>
          </Tooltip>
        </div>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Từ chối yêu cầu</DialogTitle>
              <DialogDescription>
                Vui lòng nhập lý do từ chối yêu cầu phê duyệt này.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Lý do từ chối..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={rejectAction.isPending}
              >
                {rejectAction.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Từ chối
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Request Changes Dialog */}
        <Dialog open={showChangesDialog} onOpenChange={setShowChangesDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yêu cầu chỉnh sửa</DialogTitle>
              <DialogDescription>
                Mô tả những thay đổi cần thiết trước khi phê duyệt.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Yêu cầu chỉnh sửa..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowChangesDialog(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleRequestChanges}
                disabled={requestChangesAction.isPending}
              >
                {requestChangesAction.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Gửi yêu cầu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TooltipProvider>
    );
  }

  // Full button layout
  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button
          className="bg-green-600 hover:bg-green-700"
          onClick={handleApprove}
          disabled={isLoading}
        >
          {approveAction.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Phê duyệt
        </Button>

        <Button
          variant="outline"
          onClick={() => setShowChangesDialog(true)}
          disabled={isLoading}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Yêu cầu chỉnh sửa
        </Button>

        <Button
          variant="destructive"
          onClick={() => setShowRejectDialog(true)}
          disabled={isLoading}
        >
          <X className="h-4 w-4 mr-2" />
          Từ chối
        </Button>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối yêu cầu</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do từ chối yêu cầu phê duyệt này.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Lý do từ chối..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectAction.isPending}
            >
              {rejectAction.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Changes Dialog */}
      <Dialog open={showChangesDialog} onOpenChange={setShowChangesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yêu cầu chỉnh sửa</DialogTitle>
            <DialogDescription>
              Mô tả những thay đổi cần thiết trước khi phê duyệt.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Yêu cầu chỉnh sửa..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangesDialog(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleRequestChanges}
              disabled={requestChangesAction.isPending}
            >
              {requestChangesAction.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Gửi yêu cầu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

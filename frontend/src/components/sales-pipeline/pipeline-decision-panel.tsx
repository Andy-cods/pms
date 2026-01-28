'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { SalesPipeline } from '@/types';
import { PipelineDecision } from '@/types';
import { useDecidePipeline } from '@/hooks/use-sales-pipeline';

interface PipelineDecisionPanelProps {
  pipeline: SalesPipeline;
}

export function PipelineDecisionPanel({ pipeline }: PipelineDecisionPanelProps) {
  const [declineNote, setDeclineNote] = useState('');
  const decide = useDecidePipeline();
  const router = useRouter();

  const isPending = pipeline.decision === PipelineDecision.PENDING;
  const isAccepted = pipeline.decision === PipelineDecision.ACCEPTED;
  const isDeclined = pipeline.decision === PipelineDecision.DECLINED;

  const handleAccept = async () => {
    try {
      const result = await decide.mutateAsync({ id: pipeline.id, decision: 'ACCEPTED' });
      if (result?.project) {
        toast.success(`Dự án ${result.project.code} đã được tạo!`);
        router.push(`/dashboard/projects/${result.project.id}`);
      }
    } catch {
      toast.error('Không thể chấp nhận pipeline');
    }
  };

  const handleDecline = async () => {
    try {
      await decide.mutateAsync({ id: pipeline.id, decision: 'DECLINED', note: declineNote });
      toast.info('Pipeline đã bị từ chối');
      router.push('/dashboard/sales-pipeline');
    } catch {
      toast.error('Không thể từ chối pipeline');
    }
  };

  // Already decided - show result
  if (!isPending) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Quyết định</h3>
        <div
          className={cn(
            'rounded-xl border p-4',
            isAccepted
              ? 'border-[#34c759]/30 bg-[#34c759]/5'
              : 'border-[#ff3b30]/30 bg-[#ff3b30]/5'
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            {isAccepted ? (
              <Check className="h-5 w-5 text-[#34c759]" />
            ) : (
              <X className="h-5 w-5 text-[#ff3b30]" />
            )}
            <span
              className={cn(
                'text-sm font-semibold',
                isAccepted ? 'text-[#34c759]' : 'text-[#ff3b30]'
              )}
            >
              {isAccepted ? 'Đã chấp nhận' : 'Đã từ chối'}
            </span>
          </div>
          {pipeline.decisionDate && (
            <p className="text-[12px] text-muted-foreground">
              Ngày: {new Date(pipeline.decisionDate).toLocaleDateString('vi-VN')}
            </p>
          )}
          {pipeline.decisionNote && (
            <p className="text-[13px] text-foreground mt-2">{pipeline.decisionNote}</p>
          )}
          {isAccepted && pipeline.project && (
            <Link
              href={`/dashboard/projects/${pipeline.project.id}`}
              className="inline-flex items-center gap-1 mt-3 text-[13px] font-medium text-primary hover:underline"
            >
              Xem dự án: {pipeline.project.code} - {pipeline.project.name}
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Pending - show action buttons
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Quyết định</h3>
      <p className="text-[13px] text-muted-foreground">
        Xem xét thông tin pipeline và đưa ra quyết định chấp nhận hoặc từ chối.
      </p>

      <div className="flex gap-3">
        {/* Accept */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="bg-[#34c759] hover:bg-[#2db950] text-white" disabled={decide.isPending}>
              <Check className="h-4 w-4 mr-2" />
              Chấp nhận
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Chấp nhận Pipeline?</AlertDialogTitle>
              <AlertDialogDescription>
                Pipeline sẽ được chuyển thành dự án. Thông tin tài chính sẽ được sao chép sang
                ngân sách dự án. Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleAccept}
                className="bg-[#34c759] hover:bg-[#2db950]"
              >
                Xác nhận chấp nhận
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Decline */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="text-[#ff3b30] border-[#ff3b30]/30 hover:bg-[#ff3b30]/5" disabled={decide.isPending}>
              <X className="h-4 w-4 mr-2" />
              Từ chối
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Từ chối Pipeline?</AlertDialogTitle>
              <AlertDialogDescription>
                Pipeline sẽ được đánh dấu là từ chối. Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-2">
              <Textarea
                placeholder="Lý do từ chối (tùy chọn)..."
                value={declineNote}
                onChange={(e) => setDeclineNote(e.target.value)}
                rows={3}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDecline}
                className="bg-[#ff3b30] hover:bg-[#e8352b]"
              >
                Xác nhận từ chối
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

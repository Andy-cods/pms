'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Shield, ExternalLink } from 'lucide-react';
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
import type { Project } from '@/types';
import { PipelineDecision } from '@/types';
import { useDecideProject } from '@/hooks/use-projects';

interface PipelineDecisionPanelProps {
  pipeline: Project;
}

export function PipelineDecisionPanel({ pipeline }: PipelineDecisionPanelProps) {
  const [declineNote, setDeclineNote] = useState('');
  const decide = useDecideProject();
  const router = useRouter();

  const isPending = pipeline.decision === PipelineDecision.PENDING;
  const isAccepted = pipeline.decision === PipelineDecision.ACCEPTED;
  const isDeclined = pipeline.decision === PipelineDecision.DECLINED;

  const handleAccept = async () => {
    try {
      const result = await decide.mutateAsync({ id: pipeline.id, decision: 'ACCEPTED' });
      if (result) {
        toast.success(`Dự án ${result.dealCode ?? result.name} đã được chấp nhận!`);
        router.push(`/dashboard/projects/${result.id}`);
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

  // Already decided
  if (!isPending) {
    return (
      <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/10">
              <Shield className="h-3.5 w-3.5 text-primary" />
            </div>
            <h3 className="text-[14px] font-bold text-foreground">Quyết định</h3>
          </div>

          <div className={cn(
            'rounded-lg border p-4',
            isAccepted ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'
          )}>
            <div className="flex items-center gap-2.5 mb-2">
              <div className={cn(
                'flex items-center justify-center h-8 w-8 rounded-full',
                isAccepted ? 'bg-emerald-500/15' : 'bg-rose-500/15'
              )}>
                {isAccepted ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <X className="h-4 w-4 text-rose-600" />
                )}
              </div>
              <div>
                <span className={cn(
                  'text-[14px] font-bold',
                  isAccepted ? 'text-emerald-600' : 'text-rose-600'
                )}>
                  {isAccepted ? 'Đã chấp nhận' : 'Đã từ chối'}
                </span>
                {pipeline.decisionDate && (
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(pipeline.decisionDate).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </div>
            {pipeline.decisionNote && (
              <p className="text-[13px] text-foreground/80 mt-2 pl-10">{pipeline.decisionNote}</p>
            )}
            {isAccepted && (
              <Link
                href={`/dashboard/projects/${pipeline.id}`}
                className="inline-flex items-center gap-1.5 mt-3 ml-10 text-[13px] font-semibold text-primary hover:underline"
              >
                Xem dự án: {pipeline.dealCode} - {pipeline.name}
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Pending
  return (
    <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
      <div className="px-5 pt-5 pb-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/10">
            <Shield className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="text-[14px] font-bold text-foreground">Quyết định</h3>
        </div>

        <p className="text-[13px] text-muted-foreground mb-5">
          Xem xét thông tin pipeline và đưa ra quyết định chấp nhận hoặc từ chối.
        </p>

        <div className="flex gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5" disabled={decide.isPending}>
                <Check className="h-4 w-4" />
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
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Xác nhận chấp nhận
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-rose-600 border-rose-500/30 hover:bg-rose-500/5 gap-1.5" disabled={decide.isPending}>
                <X className="h-4 w-4" />
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
                  className="resize-none"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDecline}
                  className="bg-rose-600 hover:bg-rose-700"
                >
                  Xác nhận từ chối
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

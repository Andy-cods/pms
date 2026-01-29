'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Shield, FileCheck2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
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
import { useAuth } from '@/hooks/use-auth';
import { useDecideProject } from '@/hooks/use-projects';
import { PipelineDecision, UserRole } from '@/types';
import type { Project } from '@/types';

const ALLOWED_ROLES: UserRole[] = [UserRole.PM, UserRole.ADMIN, UserRole.SUPER_ADMIN];

interface ProjectDecisionPanelProps {
  project: Project;
}

export function ProjectDecisionPanel({ project }: ProjectDecisionPanelProps) {
  const { user } = useAuth();
  const decideMutation = useDecideProject();
  const [note, setNote] = useState('');

  // Only show for PM, Admin, Super Admin
  if (!user || !ALLOWED_ROLES.includes(user.role as UserRole)) {
    return null;
  }

  // Already accepted
  if (project.decision === PipelineDecision.ACCEPTED) {
    return (
      <Card className="rounded-2xl border-emerald-500/30 bg-emerald-500/5 shadow-apple-sm">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-emerald-700 dark:text-emerald-400">
                Dự án đã được tiếp nhận
              </p>
              {project.decisionDate && (
                <p className="text-[12px] text-emerald-600/70 dark:text-emerald-400/60">
                  {new Date(project.decisionDate).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </p>
              )}
              {project.decisionNote && (
                <p className="text-[12px] text-muted-foreground mt-1">{project.decisionNote}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Already declined
  if (project.decision === PipelineDecision.DECLINED) {
    return (
      <Card className="rounded-2xl border-red-500/30 bg-red-500/5 shadow-apple-sm">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-red-700 dark:text-red-400">
                Dự án đã bị từ chối
              </p>
              {project.decisionDate && (
                <p className="text-[12px] text-red-600/70 dark:text-red-400/60">
                  {new Date(project.decisionDate).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </p>
              )}
              {project.decisionNote && (
                <p className="text-[12px] text-muted-foreground mt-1">{project.decisionNote}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // PENDING — show accept/decline
  const handleDecide = (decision: 'ACCEPTED' | 'DECLINED') => {
    decideMutation.mutate(
      { id: project.id, decision, note: note.trim() || undefined },
      {
        onSuccess: () => {
          setNote('');
          toast.success(
            decision === 'ACCEPTED'
              ? 'Đã tiếp nhận dự án! Mã dự án đã được tạo.'
              : 'Đã từ chối dự án.'
          );
        },
        onError: () => toast.error('Không thể xử lý quyết định'),
      },
    );
  };

  return (
    <Card className="rounded-2xl border-primary/30 bg-primary/5 shadow-apple-sm overflow-hidden">
      <CardContent className="pt-5 pb-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-foreground">Quyết định tiếp nhận dự án</p>
            <p className="text-[12px] text-muted-foreground">
              PM/Admin duyệt để chuyển dự án sang giai đoạn triển khai
            </p>
          </div>
        </div>

        {/* Info summary */}
        <div className="rounded-xl bg-background/60 border border-border/40 p-3 mb-4">
          <div className="grid grid-cols-2 gap-3 text-[12px]">
            <div>
              <span className="text-muted-foreground">Deal:</span>{' '}
              <span className="font-medium">{project.dealCode}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Khách hàng:</span>{' '}
              <span className="font-medium">{project.client?.companyName ?? '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">NVKD:</span>{' '}
              <span className="font-medium">{project.nvkd?.name ?? '—'}</span>
            </div>
          </div>
        </div>

        {/* Note input */}
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ghi chú quyết định (tùy chọn)..."
          rows={2}
          className="resize-none mb-4 text-[13px]"
        />

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold"
                disabled={decideMutation.isPending}
              >
                <FileCheck2 className="h-4 w-4" />
                Tiếp nhận dự án
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Tiếp nhận dự án?</AlertDialogTitle>
                <AlertDialogDescription>
                  Dự án sẽ được chuyển sang trạng thái <strong>WON &rarr; PLANNING</strong>. Hệ thống sẽ tự động tạo:
                  mã dự án, kế hoạch 4 giai đoạn, Strategic Brief, và team cơ bản.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-full">Hủy</AlertDialogCancel>
                <AlertDialogAction
                  className="rounded-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => handleDecide('ACCEPTED')}
                >
                  Xác nhận tiếp nhận
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="h-11 rounded-xl border-red-500/30 text-red-600 hover:bg-red-500/5 gap-2 font-semibold"
                disabled={decideMutation.isPending}
              >
                <XCircle className="h-4 w-4" />
                Từ chối
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Từ chối dự án?</AlertDialogTitle>
                <AlertDialogDescription>
                  Dự án sẽ được chuyển sang trạng thái <strong>LOST</strong>. Thao tác này không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-full">Hủy</AlertDialogCancel>
                <AlertDialogAction
                  className="rounded-full bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => handleDecide('DECLINED')}
                >
                  Xác nhận từ chối
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

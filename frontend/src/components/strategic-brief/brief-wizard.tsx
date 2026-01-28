'use client';

import { useCallback, useState } from 'react';
import { ChevronLeft, ChevronRight, Send, Check, RotateCcw, BookOpen } from 'lucide-react';

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
import type { StrategicBrief } from '@/lib/api/strategic-brief';
import { SECTION_CONFIGS } from './brief-section-config';
import { BriefSidebar } from './brief-sidebar';
import { BriefSectionRenderer } from './brief-section-renderer';
import {
  useUpdateBriefSection,
  useSubmitBrief,
  useApproveBrief,
  useRequestRevision,
} from '@/hooks/use-strategic-brief';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/types';

interface BriefWizardProps {
  brief: StrategicBrief;
  currentStep: number;
  onStepChange: (step: number) => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Bản nháp', color: 'bg-muted text-muted-foreground' },
  SUBMITTED: { label: 'Đã gửi duyệt', color: 'bg-blue-500/10 text-blue-600' },
  APPROVED: { label: 'Đã duyệt', color: 'bg-emerald-500/10 text-emerald-600' },
  REVISION_REQUESTED: { label: 'Yêu cầu sửa', color: 'bg-amber-500/10 text-amber-600' },
};

export function BriefWizard({ brief, currentStep, onStepChange }: BriefWizardProps) {
  const { user } = useAuth();
  const updateSection = useUpdateBriefSection();
  const submitBrief = useSubmitBrief();
  const approveBrief = useApproveBrief();
  const requestRevision = useRequestRevision();
  const [revisionComment, setRevisionComment] = useState('');

  const currentSection = brief.sections.find((s) => s.sectionNum === currentStep);
  const currentConfig = SECTION_CONFIGS.find((c) => c.sectionKey === currentSection?.sectionKey);

  const isReadOnly = brief.status === 'APPROVED';
  const canSubmit = brief.completionPct === 100 && brief.status === 'DRAFT';
  const canApprove =
    brief.status === 'SUBMITTED' &&
    user?.role &&
    [UserRole.PM, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role);

  const totalSteps = brief.sections.length;

  const handleSave = useCallback(
    (payload: { data?: Record<string, unknown>; isComplete?: boolean }) => {
      if (!currentSection || isReadOnly) return;
      updateSection.mutate({
        briefId: brief.id,
        sectionNum: currentSection.sectionNum,
        payload,
      });
    },
    [brief.id, currentSection, isReadOnly, updateSection],
  );

  const statusInfo = STATUS_LABELS[brief.status] ?? STATUS_LABELS.DRAFT;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-primary/10">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Strategic Brief</h1>
            {brief.pipeline && (
              <p className="text-[12px] text-muted-foreground">
                {brief.pipeline.projectName}
              </p>
            )}
          </div>
        </div>
        <span className={cn('px-3 py-1 rounded-lg text-[11px] font-bold', statusInfo.color)}>
          {statusInfo.label}
        </span>
      </div>

      {/* Main Layout */}
      <div className="flex gap-6">
        {/* Sidebar */}
        <BriefSidebar
          sections={brief.sections}
          currentStep={currentStep}
          onStepChange={onStepChange}
          completionPct={brief.completionPct}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {currentSection && currentConfig ? (
            <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
              {/* Section Header */}
              <div className="px-6 py-4 border-b border-border/30 bg-muted/20">
                <div className="flex items-center justify-between">
                  <h2 className="text-[16px] font-bold text-foreground">{currentSection.title}</h2>
                  <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                    {currentStep} / {totalSteps}
                  </span>
                </div>
              </div>

              {/* Section Content */}
              <div className="p-6">
                <BriefSectionRenderer
                  section={currentSection}
                  config={currentConfig}
                  onSave={handleSave}
                  readOnly={isReadOnly}
                />
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-border/30 bg-muted/10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStepChange(currentStep - 1)}
                  disabled={currentStep <= 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" /> Trước
                </Button>
                <Button
                  size="sm"
                  onClick={() => onStepChange(currentStep + 1)}
                  disabled={currentStep >= totalSteps}
                  className="gap-1"
                >
                  Tiếp <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground rounded-xl border border-border/40 bg-card">
              <p className="text-[13px]">Chọn một section từ sidebar</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {canSubmit && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="gap-1.5">
                <Send className="h-4 w-4" /> Gửi duyệt
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Gửi Brief để duyệt?</AlertDialogTitle>
                <AlertDialogDescription>
                  Brief đã hoàn thành 100% và sẵn sàng gửi cho PM/Admin duyệt.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={() => submitBrief.mutate(brief.id)}>
                  Gửi duyệt
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {canApprove && (
          <>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                  <Check className="h-4 w-4" /> Duyệt
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Duyệt Brief?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Brief sẽ được đánh dấu là đã duyệt và chuyển sang giai đoạn tiếp theo.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => approveBrief.mutate(brief.id)}
                  >
                    Xác nhận duyệt
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-amber-600 border-amber-500/30 hover:bg-amber-500/5 gap-1.5">
                  <RotateCcw className="h-4 w-4" /> Yêu cầu sửa
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Yêu cầu sửa đổi?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Brief sẽ được gửi lại cho tác giả để sửa đổi.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-2">
                  <Textarea
                    placeholder="Nhận xét (tùy chọn)..."
                    value={revisionComment}
                    onChange={(e) => setRevisionComment(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => requestRevision.mutate({ id: brief.id, comment: revisionComment })}
                  >
                    Gửi yêu cầu sửa
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </div>
  );
}

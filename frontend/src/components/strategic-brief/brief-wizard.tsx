'use client';

import { useCallback, useState } from 'react';
import { ChevronLeft, ChevronRight, Send, Check, RotateCcw } from 'lucide-react';

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
  DRAFT: { label: 'Bản nháp', color: 'bg-secondary text-muted-foreground' },
  SUBMITTED: { label: 'Đã gửi duyệt', color: 'bg-[#007aff]/10 text-[#007aff]' },
  APPROVED: { label: 'Đã duyệt', color: 'bg-[#34c759]/10 text-[#34c759]' },
  REVISION_REQUESTED: { label: 'Yêu cầu sửa', color: 'bg-[#ff9f0a]/10 text-[#ff9f0a]' },
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Strategic Brief</h1>
          {brief.pipeline && (
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {brief.pipeline.projectName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={cn('px-3 py-1 rounded-full text-[12px] font-medium', statusInfo.color)}>
            {statusInfo.label}
          </span>
        </div>
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
            <div className="space-y-6">
              {/* Section Title */}
              <div>
                <h2 className="text-lg font-semibold text-foreground">{currentSection.title}</h2>
                <p className="text-[12px] text-muted-foreground">
                  Section {currentStep} / {totalSteps}
                </p>
              </div>

              {/* Section Content */}
              <BriefSectionRenderer
                section={currentSection}
                config={currentConfig}
                onSave={handleSave}
                readOnly={isReadOnly}
              />

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <Button
                  variant="outline"
                  onClick={() => onStepChange(currentStep - 1)}
                  disabled={currentStep <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Trước
                </Button>
                <Button
                  onClick={() => onStepChange(currentStep + 1)}
                  disabled={currentStep >= totalSteps}
                >
                  Tiếp <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Chọn một section từ sidebar
            </div>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
        {/* Submit */}
        {canSubmit && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button>
                <Send className="h-4 w-4 mr-2" /> Gửi duyệt
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

        {/* Approve */}
        {canApprove && (
          <>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="bg-[#34c759] hover:bg-[#2db950] text-white">
                  <Check className="h-4 w-4 mr-2" /> Duyệt
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
                    className="bg-[#34c759] hover:bg-[#2db950]"
                    onClick={() => approveBrief.mutate(brief.id)}
                  >
                    Xác nhận duyệt
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-[#ff9f0a] border-[#ff9f0a]/30">
                  <RotateCcw className="h-4 w-4 mr-2" /> Yêu cầu sửa
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

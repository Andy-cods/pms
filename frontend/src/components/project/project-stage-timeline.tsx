'use client';

import { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type ProjectStage, ProjectStageLabels } from '@/lib/api/projects';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Ordered stages for timeline
const STAGE_ORDER: ProjectStage[] = [
  'INTAKE',
  'DISCOVERY',
  'PLANNING',
  'UNDER_REVIEW',
  'PROPOSAL_PITCH',
  'ONGOING',
  'OPTIMIZATION',
  'COMPLETED',
  'CLOSED',
];

interface ProjectStageTimelineProps {
  currentStage: ProjectStage;
  stageProgress: number;
  onStageChange?: (stage: ProjectStage, reason?: string) => void;
  onProgressChange?: (progress: number) => void;
  isEditable?: boolean;
  compact?: boolean;
}

export function ProjectStageTimeline({
  currentStage,
  stageProgress,
  onStageChange,
  onProgressChange,
  isEditable = false,
  compact = false,
}: ProjectStageTimelineProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    stage: ProjectStage | null;
  }>({ open: false, stage: null });
  const [stageReason, setStageReason] = useState('');

  // Local state for progress with debounce
  const [localProgress, setLocalProgress] = useState(stageProgress);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local progress with prop changes
  useEffect(() => {
    setLocalProgress(stageProgress);
  }, [stageProgress]);

  // Debounced progress change handler
  const handleProgressInput = (value: number) => {
    setLocalProgress(value);

    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new timeout for API call
    debounceRef.current = setTimeout(() => {
      if (onProgressChange) {
        onProgressChange(value);
      }
    }, 500); // 500ms debounce
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const currentIndex = STAGE_ORDER.indexOf(currentStage);

  const handleStageClick = (stage: ProjectStage, index: number) => {
    if (!isEditable || !onStageChange) return;
    if (stage === currentStage) return;

    // Show confirmation dialog
    setConfirmDialog({ open: true, stage });
  };

  const confirmStageChange = () => {
    if (confirmDialog.stage && onStageChange) {
      onStageChange(confirmDialog.stage, stageReason || undefined);
    }
    setConfirmDialog({ open: false, stage: null });
    setStageReason('');
  };

  const getStageStatus = (index: number): 'completed' | 'current' | 'upcoming' => {
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'upcoming';
  };

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-1">
          {STAGE_ORDER.map((stage, index) => {
            const status = getStageStatus(index);
            return (
              <Tooltip key={stage}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => handleStageClick(stage, index)}
                    disabled={!isEditable}
                    className={cn(
                      'h-2 w-2 rounded-full transition-all',
                      status === 'completed' && 'bg-[#34c759] dark:bg-[#30d158]',
                      status === 'current' && 'bg-[#007aff] dark:bg-[#0a84ff] ring-2 ring-[#007aff]/30 dark:ring-[#0a84ff]/30',
                      status === 'upcoming' && 'bg-gray-200 dark:bg-gray-700',
                      isEditable && 'cursor-pointer hover:scale-125'
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <p className="font-medium">{ProjectStageLabels[stage]}</p>
                  {status === 'current' && (
                    <p className="text-muted-foreground">{stageProgress}% complete</p>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="w-full">
        {/* Timeline */}
        <div className="relative">
          {/* Connection line */}
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 dark:bg-gray-700" />
          <div
            className="absolute top-4 left-4 h-0.5 bg-[#34c759] dark:bg-[#30d158] transition-all duration-500"
            style={{
              width: `calc(${(currentIndex / (STAGE_ORDER.length - 1)) * 100}% - 32px + ${(stageProgress / 100) * (100 / (STAGE_ORDER.length - 1))}%)`,
            }}
          />

          {/* Stage dots */}
          <div className="relative flex justify-between">
            {STAGE_ORDER.map((stage, index) => {
              const status = getStageStatus(index);
              const isClickable = isEditable && stage !== currentStage;

              return (
                <Tooltip key={stage}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleStageClick(stage, index)}
                      disabled={!isClickable}
                      className={cn(
                        'relative flex flex-col items-center group',
                        isClickable && 'cursor-pointer'
                      )}
                    >
                      {/* Dot */}
                      <div
                        className={cn(
                          'h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 border-2',
                          status === 'completed' && 'bg-[#34c759] dark:bg-[#30d158] border-[#34c759] dark:border-[#30d158] text-white',
                          status === 'current' && 'bg-[#007aff] dark:bg-[#0a84ff] border-[#007aff] dark:border-[#0a84ff] text-white ring-4 ring-[#007aff]/20 dark:ring-[#0a84ff]/20',
                          status === 'upcoming' && 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600',
                          isClickable && 'group-hover:scale-110 group-hover:shadow-lg'
                        )}
                      >
                        {status === 'completed' ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <span className={cn(
                            'text-xs font-semibold',
                            status === 'upcoming' && 'text-gray-400 dark:text-gray-500'
                          )}>
                            {index + 1}
                          </span>
                        )}
                      </div>

                      {/* Label */}
                      <span
                        className={cn(
                          'mt-2 text-[10px] font-medium text-center max-w-[60px] leading-tight',
                          status === 'completed' && 'text-[#34c759] dark:text-[#30d158]',
                          status === 'current' && 'text-[#007aff] dark:text-[#0a84ff]',
                          status === 'upcoming' && 'text-gray-400 dark:text-gray-500'
                        )}
                      >
                        {ProjectStageLabels[stage]}
                      </span>

                      {/* Progress indicator for current stage */}
                      {status === 'current' && stageProgress > 0 && (
                        <div className="mt-1 w-12 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#007aff] dark:bg-[#0a84ff] transition-all duration-300"
                            style={{ width: `${stageProgress}%` }}
                          />
                        </div>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="font-medium">{ProjectStageLabels[stage]}</p>
                    {status === 'current' && (
                      <p className="text-muted-foreground text-xs">{stageProgress}% complete</p>
                    )}
                    {status === 'completed' && (
                      <p className="text-muted-foreground text-xs">Completed</p>
                    )}
                    {isClickable && (
                      <p className="text-muted-foreground text-xs mt-1">Click to change</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Current stage progress slider (if editable) */}
        {isEditable && onProgressChange && (
          <div className="mt-6 px-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                {ProjectStageLabels[currentStage]} Progress
              </span>
              <span className="text-sm font-semibold text-[#007aff] dark:text-[#0a84ff]">
                {localProgress}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={localProgress}
              onChange={(e) => handleProgressInput(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-[#007aff]
                [&::-webkit-slider-thumb]:dark:bg-[#0a84ff]
                [&::-webkit-slider-thumb]:shadow-md
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:hover:scale-110
                [&::-moz-range-thumb]:w-4
                [&::-moz-range-thumb]:h-4
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-[#007aff]
                [&::-moz-range-thumb]:dark:bg-[#0a84ff]
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:shadow-md
                [&::-moz-range-thumb]:cursor-pointer"
            />
          </div>
        )}

        {/* Confirmation Dialog */}
        <AlertDialog
          open={confirmDialog.open}
          onOpenChange={(open) => {
            setConfirmDialog({ open, stage: open ? confirmDialog.stage : null });
            if (!open) setStageReason('');
          }}
        >
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Chuyển giai đoạn dự án?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div>
                  <p>
                    Chuyển từ{' '}
                    <span className="font-semibold text-foreground">{ProjectStageLabels[currentStage]}</span> sang{' '}
                    <span className="font-semibold text-foreground">
                      {confirmDialog.stage ? ProjectStageLabels[confirmDialog.stage] : ''}
                    </span>
                    ?
                  </p>
                  {confirmDialog.stage &&
                    STAGE_ORDER.indexOf(confirmDialog.stage) < currentIndex && (
                      <p className="mt-2 text-[#ff9500] dark:text-[#ff9f0a]">
                        Cảnh báo: Bạn đang quay lại giai đoạn trước.
                      </p>
                    )}
                  <div className="mt-4">
                    <label htmlFor="stage-reason" className="text-sm font-medium text-foreground block mb-1.5">
                      Lý do thay đổi
                    </label>
                    <textarea
                      id="stage-reason"
                      value={stageReason}
                      onChange={(e) => setStageReason(e.target.value)}
                      placeholder="Nhập lý do thay đổi giai đoạn..."
                      className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    />
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-full">Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={confirmStageChange} className="rounded-full">
                Xác nhận
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
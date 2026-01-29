'use client';

import { cn } from '@/lib/utils';
import { ProjectLifecycle, ProjectPhaseGroup } from '@/types';
import {
  LIFECYCLE_TO_PHASE,
  PhaseGroupLabels,
  ProjectLifecycleLabels,
  PHASE_GROUP_ORDER,
  getPhaseGroupIndex,
} from '@/lib/api/projects';

interface PhaseProgressBarProps {
  lifecycle: ProjectLifecycle;
  stageProgress?: number;
  compact?: boolean;
  showLabels?: boolean;
  showSubStage?: boolean;
  className?: string;
}

const PHASE_COLORS = {
  completed: {
    dot: 'bg-green-500 dark:bg-green-400',
    line: 'bg-green-500 dark:bg-green-400',
    label: 'text-green-700 dark:text-green-400',
  },
  current: {
    dot: 'bg-blue-500 dark:bg-blue-400 ring-4 ring-blue-500/20',
    line: 'bg-blue-500/30 dark:bg-blue-400/30',
    label: 'text-blue-700 dark:text-blue-400 font-semibold',
  },
  upcoming: {
    dot: 'bg-gray-200 dark:bg-gray-700',
    line: 'bg-gray-200 dark:bg-gray-700',
    label: 'text-muted-foreground',
  },
  lost: {
    dot: 'bg-red-500 dark:bg-red-400',
    line: 'bg-red-500/30',
    label: 'text-red-700 dark:text-red-400',
  },
};

export function PhaseProgressBar({
  lifecycle,
  stageProgress = 0,
  compact = false,
  showLabels = true,
  showSubStage = true,
  className,
}: PhaseProgressBarProps) {
  const currentPhase = LIFECYCLE_TO_PHASE[lifecycle];
  const isLost = currentPhase === ProjectPhaseGroup.LOST;
  const currentIdx = isLost ? -1 : getPhaseGroupIndex(currentPhase);

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {/* 4 segments */}
        <div className="flex gap-0.5 flex-1">
          {PHASE_GROUP_ORDER.map((pg, idx) => {
            let color = 'bg-gray-200 dark:bg-gray-700';
            if (isLost) {
              // Show red for all up to where it stopped
              color = 'bg-red-200 dark:bg-red-900/50';
            } else if (idx < currentIdx) {
              color = 'bg-green-500 dark:bg-green-400';
            } else if (idx === currentIdx) {
              color = 'bg-blue-500 dark:bg-blue-400';
            }
            return (
              <div
                key={pg}
                className={cn('h-1.5 flex-1 rounded-full transition-colors', color)}
              />
            );
          })}
        </div>
        {/* Label */}
        <span className={cn(
          'text-caption font-medium whitespace-nowrap',
          isLost ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground',
        )}>
          {isLost ? 'Từ chối' : PhaseGroupLabels[currentPhase]}
          {!isLost && showSubStage && ` · ${ProjectLifecycleLabels[lifecycle]}`}
          {!isLost && stageProgress > 0 && ` (${stageProgress}%)`}
        </span>
      </div>
    );
  }

  // Full mode
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center">
        {PHASE_GROUP_ORDER.map((pg, idx) => {
          let state: 'completed' | 'current' | 'upcoming' | 'lost' = 'upcoming';
          if (isLost) {
            state = 'lost';
          } else if (idx < currentIdx) {
            state = 'completed';
          } else if (idx === currentIdx) {
            state = 'current';
          }

          const colors = PHASE_COLORS[state];
          const isLast = idx === PHASE_GROUP_ORDER.length - 1;

          return (
            <div key={pg} className="flex items-center flex-1 last:flex-none">
              {/* Phase dot */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'rounded-full transition-all duration-300',
                    state === 'current' ? 'h-4 w-4' : 'h-3 w-3',
                    colors.dot,
                  )}
                />
                {showLabels && (
                  <span className={cn(
                    'mt-2 text-caption whitespace-nowrap',
                    colors.label,
                  )}>
                    {PhaseGroupLabels[pg]}
                  </span>
                )}
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div className={cn(
                  'h-0.5 flex-1 mx-2 rounded-full transition-colors',
                  idx < currentIdx
                    ? PHASE_COLORS.completed.line
                    : idx === currentIdx
                      ? PHASE_COLORS.current.line
                      : PHASE_COLORS.upcoming.line,
                  isLost && 'bg-red-200 dark:bg-red-900/50',
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Sub-stage info */}
      {showSubStage && (
        <div className={cn(
          'mt-3 flex items-center gap-3',
          isLost ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground',
        )}>
          <span className="text-footnote font-medium">
            {isLost ? 'Từ chối' : ProjectLifecycleLabels[lifecycle]}
          </span>
          {!isLost && stageProgress > 0 && (
            <>
              <div className="h-1.5 flex-1 max-w-[200px] rounded-full bg-surface overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 dark:bg-blue-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, stageProgress)}%` }}
                />
              </div>
              <span className="text-caption font-medium tabular-nums">{stageProgress}%</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

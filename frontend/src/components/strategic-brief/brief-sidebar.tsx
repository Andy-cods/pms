'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BriefSection } from '@/lib/api/strategic-brief';

interface BriefSidebarProps {
  sections: BriefSection[];
  currentStep: number;
  onStepChange: (step: number) => void;
  completionPct: number;
}

export function BriefSidebar({ sections, currentStep, onStepChange, completionPct }: BriefSidebarProps) {
  const completedCount = sections.filter((s) => s.isComplete).length;

  return (
    <div className="w-64 shrink-0 space-y-4">
      {/* Progress Card */}
      <div className="rounded-xl border border-border/40 bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Tiến độ</span>
          <span className="text-[14px] font-bold text-foreground tabular-nums">{completionPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              completionPct === 100 ? 'bg-emerald-500' : 'bg-primary'
            )}
            style={{ width: `${completionPct}%` }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          {completedCount}/{sections.length} sections hoàn thành
        </p>
      </div>

      {/* Section List */}
      <nav className="space-y-0.5">
        {sections.map((section) => {
          const isActive = currentStep === section.sectionNum;
          return (
            <button
              key={section.sectionNum}
              onClick={() => onStepChange(section.sectionNum)}
              className={cn(
                'flex items-center gap-2.5 w-full rounded-lg px-3 py-2.5 text-left text-[13px] transition-all duration-150',
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              {/* Status indicator */}
              <span className={cn(
                'flex items-center justify-center h-6 w-6 rounded-full shrink-0 text-[10px] font-bold transition-colors',
                section.isComplete
                  ? 'bg-emerald-500 text-white'
                  : isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
              )}>
                {section.isComplete ? (
                  <Check className="h-3 w-3" />
                ) : (
                  section.sectionNum
                )}
              </span>
              <span className="truncate">{section.title}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

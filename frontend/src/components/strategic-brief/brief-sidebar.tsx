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
  return (
    <div className="w-64 shrink-0 space-y-4">
      {/* Progress */}
      <div className="rounded-xl border border-border/50 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-medium text-muted-foreground">Tiến độ</span>
          <span className="text-[13px] font-semibold text-foreground">{completionPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      {/* Section List */}
      <nav className="space-y-0.5">
        {sections.map((section) => (
          <button
            key={section.sectionNum}
            onClick={() => onStepChange(section.sectionNum)}
            className={cn(
              'flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-left text-[13px] transition-colors',
              currentStep === section.sectionNum
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
            )}
          >
            {/* Status indicator */}
            <span
              className={cn(
                'flex items-center justify-center h-5 w-5 rounded-full shrink-0 text-[10px] font-medium',
                section.isComplete
                  ? 'bg-[#34c759] text-white'
                  : currentStep === section.sectionNum
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground'
              )}
            >
              {section.isComplete ? (
                <Check className="h-3 w-3" />
              ) : (
                section.sectionNum
              )}
            </span>
            <span className="truncate">{section.title}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

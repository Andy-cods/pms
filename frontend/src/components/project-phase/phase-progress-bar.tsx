'use client';

import { cn } from '@/lib/utils';
import { Layers } from 'lucide-react';
import type { ProjectPhase } from '@/lib/api/project-phases';

const PHASE_COLORS: Record<string, { bar: string; text: string }> = {
  KHOI_TAO_PLAN: { bar: 'bg-blue-500', text: 'text-blue-600' },
  SETUP_CHUAN_BI: { bar: 'bg-amber-500', text: 'text-amber-600' },
  VAN_HANH_TOI_UU: { bar: 'bg-emerald-500', text: 'text-emerald-600' },
  TONG_KET: { bar: 'bg-violet-500', text: 'text-violet-600' },
};

interface PhaseProgressBarProps {
  phases: ProjectPhase[];
}

export function PhaseProgressBar({ phases }: PhaseProgressBarProps) {
  const totalWeight = phases.reduce((sum, p) => sum + p.weight, 0);
  const overall =
    totalWeight > 0
      ? Math.round(phases.reduce((sum, p) => sum + p.weight * p.progress, 0) / totalWeight)
      : 0;

  return (
    <div className="rounded-xl border border-border/40 bg-card p-5">
      {/* Header + Overall */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/10">
            <Layers className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="text-[14px] font-bold text-foreground">Tiến độ dự án</h3>
        </div>
        <span className="text-[18px] font-bold text-foreground tabular-nums">{overall}%</span>
      </div>

      {/* Overall Bar */}
      <div className="h-2.5 bg-muted rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
          style={{ width: `${overall}%` }}
        />
      </div>

      {/* Per-phase segments */}
      <div className="grid grid-cols-4 gap-3">
        {phases.map((phase) => {
          const colors = PHASE_COLORS[phase.phaseType] || { bar: 'bg-slate-400', text: 'text-slate-500' };
          return (
            <div key={phase.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className={cn('text-[11px] font-semibold', colors.text)}>
                  {phase.progress}%
                </span>
                <span className="text-[10px] text-muted-foreground">w:{phase.weight}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', colors.bar)}
                  style={{ width: `${phase.progress}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground truncate">{phase.name}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

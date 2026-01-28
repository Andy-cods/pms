'use client';

import type { ProjectPhase } from '@/lib/api/project-phases';

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
    <div className="space-y-3">
      {/* Overall progress */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">Tiến độ dự án</span>
        <span className="text-sm font-semibold text-foreground">{overall}%</span>
      </div>
      <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${overall}%` }}
        />
      </div>

      {/* Per-phase segments */}
      <div className="flex gap-1.5">
        {phases.map((phase) => (
          <div key={phase.id} className="min-w-0" style={{ flex: phase.weight }}>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary/60 rounded-full transition-all duration-300"
                style={{ width: `${phase.progress}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 truncate">
              {phase.name} ({phase.weight}%)
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

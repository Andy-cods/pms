'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProjectPhase } from '@/lib/api/project-phases';
import { PhaseItemRow } from './phase-item-row';
import { AddItemDialog } from './add-item-dialog';
import { LinkTaskModal } from './link-task-modal';

interface PhaseCardProps {
  phase: ProjectPhase;
  projectId: string;
  tasks?: { id: string; title: string; status: string }[];
}

const PHASE_COLORS: Record<string, { accent: string; bg: string; text: string }> = {
  KHOI_TAO_PLAN: { accent: 'bg-blue-500', bg: 'bg-blue-500/8', text: 'text-blue-600' },
  SETUP_CHUAN_BI: { accent: 'bg-amber-500', bg: 'bg-amber-500/8', text: 'text-amber-600' },
  VAN_HANH_TOI_UU: { accent: 'bg-emerald-500', bg: 'bg-emerald-500/8', text: 'text-emerald-600' },
  TONG_KET: { accent: 'bg-violet-500', bg: 'bg-violet-500/8', text: 'text-violet-600' },
};

export function PhaseCard({ phase, projectId, tasks = [] }: PhaseCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [linkModal, setLinkModal] = useState<{ phaseId: string; itemId: string } | null>(null);

  const colors = PHASE_COLORS[phase.phaseType] || { accent: 'bg-slate-400', bg: 'bg-slate-400/8', text: 'text-slate-500' };
  const sortedItems = [...phase.items].sort((a, b) => a.orderIndex - b.orderIndex);
  const completedCount = sortedItems.filter((i) => i.isComplete).length;

  return (
    <>
      <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-muted/30 transition-colors"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', colors.accent)} />
          <span className="text-[14px] font-semibold text-foreground">{phase.name}</span>

          {/* Completion count */}
          <span className="text-[11px] text-muted-foreground ml-1">
            ({completedCount}/{sortedItems.length})
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <span className={cn('text-[11px] font-medium px-1.5 py-0.5 rounded-md', colors.bg, colors.text)}>
              w:{phase.weight}%
            </span>
            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', colors.accent)}
                style={{ width: `${phase.progress}%` }}
              />
            </div>
            <span className={cn('text-[12px] font-bold tabular-nums w-10 text-right', colors.text)}>
              {phase.progress}%
            </span>
          </div>
        </button>

        {/* Items */}
        {expanded && (
          <div className="border-t border-border/30 px-2 py-2">
            {sortedItems.length === 0 && (
              <p className="text-[13px] text-muted-foreground/60 text-center py-6">
                Chưa có item nào
              </p>
            )}
            {sortedItems.map((item) => (
              <PhaseItemRow
                key={item.id}
                item={item}
                projectId={projectId}
                phaseId={phase.id}
                onLinkTask={(itemId) => setLinkModal({ phaseId: phase.id, itemId })}
              />
            ))}
            <div className="px-3 pt-1">
              <AddItemDialog projectId={projectId} phaseId={phase.id} />
            </div>
          </div>
        )}
      </div>

      {linkModal && (
        <LinkTaskModal
          open
          onClose={() => setLinkModal(null)}
          projectId={projectId}
          phaseId={linkModal.phaseId}
          itemId={linkModal.itemId}
          tasks={tasks}
        />
      )}
    </>
  );
}

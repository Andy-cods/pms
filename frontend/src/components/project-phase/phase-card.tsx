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

const PHASE_COLORS: Record<string, string> = {
  KHOI_TAO_PLAN: '#007aff',
  SETUP_CHUAN_BI: '#ff9f0a',
  VAN_HANH_TOI_UU: '#34c759',
  TONG_KET: '#af52de',
};

export function PhaseCard({ phase, projectId, tasks = [] }: PhaseCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [linkModal, setLinkModal] = useState<{ phaseId: string; itemId: string } | null>(null);

  const color = PHASE_COLORS[phase.phaseType] || '#8e8e93';
  const sortedItems = [...phase.items].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <>
      <div className="rounded-xl border border-border/50 overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 w-full px-4 py-3 hover:bg-secondary/30 transition-colors"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-[14px] font-semibold text-foreground">{phase.name}</span>
          <span className="text-[12px] text-muted-foreground ml-auto">
            Weight: {phase.weight}%
          </span>
          <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden ml-2">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${phase.progress}%`, backgroundColor: color }}
            />
          </div>
          <span className="text-[12px] font-medium text-foreground w-10 text-right">
            {phase.progress}%
          </span>
        </button>

        {/* Items */}
        {expanded && (
          <div className="border-t border-border/30 px-2 py-2">
            {sortedItems.length === 0 && (
              <p className="text-[13px] text-muted-foreground text-center py-4">
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

      {/* Link Task Modal */}
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

'use client';

import * as React from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { cn } from '@/lib/utils';
import { PipelineStage, PipelineStageLabels, type SalesPipeline } from '@/types';
import { PipelineCard, PipelineCardSkeleton } from './pipeline-card';
import { ScrollArea } from '@/components/ui/scroll-area';

const STAGE_COLORS: Record<string, { accent: string; bg: string; text: string }> = {
  LEAD: { accent: 'bg-slate-400', bg: 'bg-slate-400/8', text: 'text-slate-500' },
  QUALIFIED: { accent: 'bg-blue-500', bg: 'bg-blue-500/8', text: 'text-blue-600' },
  EVALUATION: { accent: 'bg-amber-500', bg: 'bg-amber-500/8', text: 'text-amber-600' },
  NEGOTIATION: { accent: 'bg-violet-500', bg: 'bg-violet-500/8', text: 'text-violet-600' },
  WON: { accent: 'bg-emerald-500', bg: 'bg-emerald-500/8', text: 'text-emerald-600' },
  LOST: { accent: 'bg-rose-500', bg: 'bg-rose-500/8', text: 'text-rose-600' },
};

const STAGE_ORDER: PipelineStage[] = [
  PipelineStage.LEAD,
  PipelineStage.QUALIFIED,
  PipelineStage.EVALUATION,
  PipelineStage.NEGOTIATION,
  PipelineStage.WON,
  PipelineStage.LOST,
];

function formatColumnValue(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString('vi-VN');
}

interface PipelineKanbanBoardProps {
  pipelines: SalesPipeline[];
  onStageChange?: (pipelineId: string, newStage: PipelineStage) => void;
  onPipelineClick?: (pipeline: SalesPipeline) => void;
  isLoading?: boolean;
}

export function PipelineKanbanBoard({
  pipelines,
  onStageChange,
  onPipelineClick,
  isLoading = false,
}: PipelineKanbanBoardProps) {
  const [activePipeline, setActivePipeline] = React.useState<SalesPipeline | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const columns = React.useMemo(() => {
    return STAGE_ORDER.map((stage) => {
      const items = pipelines.filter((p) => p.status === stage);
      const totalValue = items.reduce((sum, p) => sum + (p.totalBudget ?? 0), 0);
      return {
        stage,
        label: PipelineStageLabels[stage],
        colors: STAGE_COLORS[stage],
        items,
        totalValue,
      };
    });
  }, [pipelines]);

  const handleDragStart = (event: DragStartEvent) => {
    const found = pipelines.find((p) => p.id === event.active.id);
    if (found) setActivePipeline(found);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      setActivePipeline(null);
      return;
    }

    const overId = over.id as string;
    const targetColumn = STAGE_ORDER.find((s) => s === overId);
    if (targetColumn) {
      onStageChange?.(active.id as string, targetColumn);
    } else {
      for (const col of columns) {
        if (col.items.some((p) => p.id === overId)) {
          onStageChange?.(active.id as string, col.stage);
          break;
        }
      }
    }
    setActivePipeline(null);
  };

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGE_ORDER.map((stage) => (
          <PipelineColumnSkeleton key={stage} stage={stage} />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4 min-h-[calc(100vh-300px)]">
        {columns.map((col) => (
          <PipelineColumn
            key={col.stage}
            stage={col.stage}
            label={col.label}
            colors={col.colors}
            items={col.items}
            totalValue={col.totalValue}
            onPipelineClick={onPipelineClick}
          />
        ))}
      </div>

      <DragOverlay
        dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
      >
        {activePipeline ? (
          <div className="rotate-2 scale-105 opacity-95">
            <PipelineCard pipeline={activePipeline} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

interface PipelineColumnProps {
  stage: PipelineStage;
  label: string;
  colors: { accent: string; bg: string; text: string };
  items: SalesPipeline[];
  totalValue: number;
  onPipelineClick?: (pipeline: SalesPipeline) => void;
}

function PipelineColumn({ stage, label, colors, items, totalValue, onPipelineClick }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useSortable({
    id: stage,
    data: { type: 'column', stage },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col w-[290px] min-w-[290px]',
        'rounded-xl bg-muted/30',
        'transition-all duration-200 ease-out',
        isOver && 'ring-2 ring-primary/40 bg-primary/5 scale-[1.01]'
      )}
    >
      {/* Column Header */}
      <div className="px-3.5 pt-3.5 pb-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <div className={cn('h-2 w-2 rounded-full', colors.accent)} />
            <h3 className="text-[13px] font-bold text-foreground tracking-tight">{label}</h3>
          </div>
          <span className={cn(
            'inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5',
            'text-[11px] font-bold rounded-md',
            colors.bg, colors.text
          )}>
            {items.length}
          </span>
        </div>

        {/* Column Value Summary */}
        {totalValue > 0 && (
          <p className="text-[11px] tabular-nums text-muted-foreground font-medium pl-4">
            {formatColumnValue(totalValue)} VND
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="mx-3.5 mb-2">
        <div className={cn('h-0.5 rounded-full', colors.accent, 'opacity-30')} />
      </div>

      {/* Items */}
      <ScrollArea className="flex-1 px-2">
        <SortableContext items={items.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 pb-3">
            {items.map((pipeline) => (
              <SortablePipelineCard
                key={pipeline.id}
                pipeline={pipeline}
                onClick={() => onPipelineClick?.(pipeline)}
              />
            ))}
            {items.length === 0 && (
              <div className="flex flex-col items-center justify-center h-28 mx-1 rounded-xl border-2 border-dashed border-border/40 text-muted-foreground/60">
                <div className={cn('h-6 w-6 rounded-full mb-2 opacity-30', colors.accent)} />
                <p className="text-[12px] font-medium">Trống</p>
              </div>
            )}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
}

interface SortablePipelineCardProps {
  pipeline: SalesPipeline;
  onClick?: () => void;
}

function SortablePipelineCard({ pipeline, onClick }: SortablePipelineCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: pipeline.id,
    data: { type: 'pipeline', pipeline },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn('touch-manipulation', isDragging && 'opacity-30')}
    >
      <PipelineCard pipeline={pipeline} onClick={onClick} isDragging={isDragging} />
    </div>
  );
}

function PipelineColumnSkeleton({ stage }: { stage: string }) {
  const colors = STAGE_COLORS[stage] || STAGE_COLORS.LEAD;
  return (
    <div className="flex flex-col w-[290px] min-w-[290px] rounded-xl bg-muted/30">
      <div className="px-3.5 pt-3.5 pb-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <div className={cn('h-2 w-2 rounded-full', colors.accent)} />
            <div className="h-4 w-20 bg-muted rounded-md animate-pulse" />
          </div>
          <div className="h-[22px] w-[22px] bg-muted rounded-md animate-pulse" />
        </div>
        <div className="h-3 w-16 bg-muted rounded-md animate-pulse ml-4" />
      </div>
      <div className="mx-3.5 mb-2">
        <div className={cn('h-0.5 rounded-full opacity-30', colors.accent)} />
      </div>
      <div className="px-2 space-y-2 pb-3">
        <PipelineCardSkeleton />
        <PipelineCardSkeleton />
      </div>
    </div>
  );
}

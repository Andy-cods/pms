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

const STAGE_COLORS: Record<string, string> = {
  LEAD: '#8e8e93',
  QUALIFIED: '#007aff',
  EVALUATION: '#ff9f0a',
  NEGOTIATION: '#af52de',
  WON: '#34c759',
  LOST: '#ff3b30',
};

const STAGE_ORDER: PipelineStage[] = [
  PipelineStage.LEAD,
  PipelineStage.QUALIFIED,
  PipelineStage.EVALUATION,
  PipelineStage.NEGOTIATION,
  PipelineStage.WON,
  PipelineStage.LOST,
];

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

  // Group pipelines by stage
  const columns = React.useMemo(() => {
    return STAGE_ORDER.map((stage) => ({
      stage,
      label: PipelineStageLabels[stage],
      color: STAGE_COLORS[stage],
      items: pipelines.filter((p) => p.status === stage),
    }));
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
    // Dropped on column
    const targetColumn = STAGE_ORDER.find((s) => s === overId);
    if (targetColumn) {
      onStageChange?.(active.id as string, targetColumn);
    } else {
      // Dropped on a card → find its column
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
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGE_ORDER.map((stage) => (
          <PipelineColumnSkeleton key={stage} />
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
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-300px)]">
        {columns.map((col) => (
          <PipelineColumn
            key={col.stage}
            stage={col.stage}
            label={col.label}
            color={col.color}
            items={col.items}
            onPipelineClick={onPipelineClick}
          />
        ))}
      </div>

      <DragOverlay
        dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
      >
        {activePipeline ? (
          <div className="rotate-2 scale-105">
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
  color: string;
  items: SalesPipeline[];
  onPipelineClick?: (pipeline: SalesPipeline) => void;
}

function PipelineColumn({ stage, label, color, items, onPipelineClick }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useSortable({
    id: stage,
    data: { type: 'column', stage },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col w-[280px] min-w-[280px]',
        'rounded-2xl bg-secondary/30',
        'transition-all duration-200 ease-out',
        isOver && 'ring-2 ring-dashed ring-primary/50 bg-primary/5'
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
          <h3 className="text-[15px] font-semibold text-foreground">{label}</h3>
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[12px] font-medium rounded-full bg-secondary text-muted-foreground">
            {items.length}
          </span>
        </div>
      </div>

      {/* Items */}
      <ScrollArea className="flex-1 px-2">
        <SortableContext items={items.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 pb-4">
            {items.map((pipeline) => (
              <SortablePipelineCard
                key={pipeline.id}
                pipeline={pipeline}
                onClick={() => onPipelineClick?.(pipeline)}
              />
            ))}
            {items.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-border/50 text-muted-foreground text-[13px]">
                <p>No pipelines</p>
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
      className={cn('touch-manipulation', isDragging && 'opacity-40')}
    >
      <PipelineCard pipeline={pipeline} onClick={onClick} isDragging={isDragging} />
    </div>
  );
}

function PipelineColumnSkeleton() {
  return (
    <div className="flex flex-col w-[280px] min-w-[280px] rounded-2xl bg-secondary/30">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-secondary animate-pulse" />
          <div className="h-4 w-20 bg-secondary rounded animate-pulse" />
          <div className="h-5 w-6 bg-secondary rounded-full animate-pulse" />
        </div>
      </div>
      <div className="px-2 space-y-2 pb-4">
        <PipelineCardSkeleton />
        <PipelineCardSkeleton />
      </div>
    </div>
  );
}

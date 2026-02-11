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
import { Plus } from 'lucide-react';

import { cn } from '@/lib/utils';
import { type Task, type TaskStatus } from '@/lib/api/tasks';
import { KanbanColumnConfig } from '@/lib/task-design-tokens';
import { TaskCard, TaskCardSkeleton } from './task-card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface KanbanBoardProps {
  columns: {
    status: TaskStatus;
    label: string;
    tasks: Task[];
  }[];
  onTaskMove?: (taskId: string, newStatus: TaskStatus, newIndex: number) => void;
  onTaskClick?: (task: Task) => void;
  onTaskStatusChange?: (taskId: string, status: TaskStatus) => void;
  onTaskDelete?: (taskId: string) => void;
  onAddTask?: (status: TaskStatus) => void;
  isLoading?: boolean;
}

/**
 * Apple-style Kanban Board Component
 * - Columns with subtle headers
 * - Cards: clean, minimal, floating
 * - Drag indicator subtle
 * - Drop zones with dashed border on hover
 * - Column counts in badges
 * - Smooth drag animations
 */
export function KanbanBoard({
  columns,
  onTaskMove,
  onTaskClick,
  onTaskStatusChange,
  onTaskDelete,
  onAddTask,
  isLoading = false,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);

  // Configure sensors for drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Find active task when drag starts
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    // Find the task being dragged
    for (const column of columns) {
      const task = column.tasks.find((t) => t.id === active.id);
      if (task) {
        setActiveTask(task);
        break;
      }
    }
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveTask(null);
      return;
    }

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column
    const targetColumn = columns.find((col) => col.status === overId);
    if (targetColumn) {
      // Dropped on column header - add to end
      onTaskMove?.(activeTaskId, targetColumn.status, targetColumn.tasks.length);
    } else {
      // Dropped on a task - find which column and index
      for (const column of columns) {
        const taskIndex = column.tasks.findIndex((t) => t.id === overId);
        if (taskIndex !== -1) {
          onTaskMove?.(activeTaskId, column.status, taskIndex);
          break;
        }
      }
    }

    setActiveTask(null);
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {['TODO', 'IN_PROGRESS', 'PENDING', 'REVIEW', 'DONE'].map((status) => (
          <KanbanColumnSkeleton key={status} />
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
        {columns.map((column) => (
          <KanbanColumn
            key={column.status}
            status={column.status}
            label={column.label}
            tasks={column.tasks}
            onTaskClick={onTaskClick}
            onTaskStatusChange={onTaskStatusChange}
            onTaskDelete={onTaskDelete}
            onAddTask={onAddTask}
            isActiveOver={false}
          />
        ))}
      </div>

      {/* Drag Overlay - shows card being dragged */}
      <DragOverlay dropAnimation={{
        duration: 200,
        easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      }}>
        {activeTask ? (
          <div className="rotate-2 scale-105">
            <TaskCard
              task={activeTask}
              variant="kanban"
              isDragging
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

interface KanbanColumnProps {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskStatusChange?: (taskId: string, status: TaskStatus) => void;
  onTaskDelete?: (taskId: string) => void;
  onAddTask?: (status: TaskStatus) => void;
  isActiveOver?: boolean;
}

function KanbanColumn({
  status,
  label,
  tasks,
  onTaskClick,
  onTaskStatusChange,
  onTaskDelete,
  onAddTask,
}: KanbanColumnProps) {
  const config = KanbanColumnConfig[status];

  const { setNodeRef, isOver } = useSortable({
    id: status,
    data: { type: 'column', status },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col w-[300px] min-w-[300px]',
        'rounded-2xl bg-secondary/30',
        'transition-all duration-200 ease-out',
        // Drop zone with dashed border on hover
        isOver && 'ring-2 ring-dashed ring-primary/50 bg-primary/5'
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Status color dot */}
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          {/* Label */}
          <h3 className="text-[15px] font-semibold text-foreground">
            {label}
          </h3>
          {/* Count badge */}
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[12px] font-medium rounded-full bg-secondary text-muted-foreground">
            {tasks.length}
          </span>
        </div>

        {/* Add task button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg hover:bg-secondary"
          onClick={() => onAddTask?.(status)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Tasks Container */}
      <ScrollArea className="flex-1 px-2">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 pb-4">
            {tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick?.(task)}
                onStatusChange={(newStatus) => onTaskStatusChange?.(task.id, newStatus)}
                onDelete={() => onTaskDelete?.(task.id)}
              />
            ))}

            {/* Empty state */}
            {tasks.length === 0 && (
              <div
                className={cn(
                  'flex flex-col items-center justify-center',
                  'h-32 rounded-xl border-2 border-dashed border-border/50',
                  'text-muted-foreground text-[13px]'
                )}
              >
                <p>No tasks</p>
                <button
                  className="mt-2 text-primary hover:underline text-[13px]"
                  onClick={() => onAddTask?.(status)}
                >
                  Add a task
                </button>
              </div>
            )}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
}

interface SortableTaskCardProps {
  task: Task;
  onClick?: () => void;
  onStatusChange?: (status: TaskStatus) => void;
  onDelete?: () => void;
}

function SortableTaskCard({
  task,
  onClick,
  onStatusChange,
  onDelete,
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: 'task', task },
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
      className={cn(
        'touch-manipulation',
        isDragging && 'opacity-40'
      )}
    >
      <TaskCard
        task={task}
        variant="kanban"
        onClick={onClick}
        onStatusChange={onStatusChange}
        onDelete={onDelete}
        isDragging={isDragging}
      />
    </div>
  );
}

function KanbanColumnSkeleton() {
  return (
    <div className="flex flex-col w-[300px] min-w-[300px] rounded-2xl bg-secondary/30">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-secondary animate-pulse" />
          <div className="h-4 w-20 bg-secondary rounded animate-pulse" />
          <div className="h-5 w-6 bg-secondary rounded-full animate-pulse" />
        </div>
      </div>
      <div className="px-2 space-y-2 pb-4">
        <TaskCardSkeleton variant="kanban" />
        <TaskCardSkeleton variant="kanban" />
        <TaskCardSkeleton variant="kanban" />
      </div>
    </div>
  );
}

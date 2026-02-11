'use client';

import * as React from 'react';
import { Calendar, MoreHorizontal, GripVertical } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { vi } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import { type Task, type TaskStatus } from '@/lib/api/tasks';
import {
  getPriorityStyles,
  getStatusStyles,
  ApplePriorityLabels,
  AppleStatusLabels,
} from '@/lib/task-design-tokens';
import { AppleCheckbox } from './apple-checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

/** Check if deadline ISO string has a non-midnight time component */
function hasTime(dateStr: string): boolean {
  const d = new Date(dateStr);
  return d.getHours() !== 0 || d.getMinutes() !== 0;
}

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  onStatusChange?: (status: TaskStatus) => void;
  onDelete?: () => void;
  showDragHandle?: boolean;
  isDragging?: boolean;
  variant?: 'list' | 'kanban';
  className?: string;
}

/**
 * Apple-style Task Card Component
 * - Clean, minimal design with floating effect
 * - Priority as colored left border or dot
 * - Status as colored dot indicator
 * - Subtle separators and hover states
 * - Smooth 200ms transitions
 */
export function TaskCard({
  task,
  onClick,
  onStatusChange,
  onDelete,
  showDragHandle = false,
  isDragging = false,
  variant = 'list',
  className,
}: TaskCardProps) {
  const priorityStyles = getPriorityStyles(task.priority);
  const statusStyles = getStatusStyles(task.status);
  const isCompleted = task.status === 'DONE';
  const isOverdue = task.deadline && isPast(new Date(task.deadline)) && !isCompleted;
  const isDueToday = task.deadline && isToday(new Date(task.deadline));

  // Handle checkbox change
  const handleCheckboxChange = (checked: boolean) => {
    if (checked) {
      onStatusChange?.('DONE');
    } else {
      onStatusChange?.('TODO');
    }
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (variant === 'kanban') {
    return (
      <div
        className={cn(
          // Base card styles
          'group relative bg-card rounded-2xl',
          'border border-border/50',
          'transition-all duration-200 ease-out',
          // Hover: lift with shadow
          'hover:shadow-apple-md hover:-translate-y-0.5',
          // Priority left border
          'border-l-[3px]',
          priorityStyles.border,
          // Dragging state
          isDragging && 'shadow-apple-lg scale-[1.02] opacity-90',
          className
        )}
        onClick={onClick}
      >
        {/* Drag Handle */}
        {showDragHandle && (
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}

        <div className="p-4 space-y-3">
          {/* Title */}
          <h4
            className={cn(
              'text-[15px] font-medium leading-snug line-clamp-2',
              isCompleted && 'line-through text-muted-foreground'
            )}
          >
            {task.title}
          </h4>

          {/* Project name */}
          {task.project && (
            <p className="text-[12px] text-muted-foreground truncate">
              {task.project.dealCode} · {task.project.name}
            </p>
          )}

          {/* Tags/Labels as small pills */}
          <div className="flex flex-wrap gap-1.5">
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full',
                statusStyles.bg,
                statusStyles.text
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', statusStyles.dot)} />
              {AppleStatusLabels[task.status]}
            </span>
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full',
                priorityStyles.bg,
                priorityStyles.text
              )}
            >
              {ApplePriorityLabels[task.priority]}
            </span>
          </div>

          {/* Footer: Due date & Assignees */}
          <div className="flex items-center justify-between pt-1">
            {/* Due date with time */}
            {task.deadline ? (
              <div
                className={cn(
                  'flex items-center gap-1 text-[12px]',
                  isOverdue
                    ? 'text-[#ff3b30]'
                    : isDueToday
                      ? 'text-[#ff9f0a]'
                      : 'text-muted-foreground'
                )}
              >
                <Calendar className="h-3 w-3" />
                <span>
                  {format(new Date(task.deadline), 'dd MMM', { locale: vi })}
                  {hasTime(task.deadline) && ` ${format(new Date(task.deadline), 'HH:mm')}`}
                </span>
              </div>
            ) : (
              <div />
            )}

            {/* Assignee avatars at bottom */}
            {task.assignees && task.assignees.length > 0 && (
              <div className="flex -space-x-1.5">
                {task.assignees.slice(0, 3).map((assignee) => (
                  <Avatar
                    key={assignee.id}
                    className="h-6 w-6 border-2 border-card"
                  >
                    {assignee.user.avatar ? (
                      <AvatarImage src={assignee.user.avatar} alt={assignee.user.name} />
                    ) : null}
                    <AvatarFallback className="text-[10px] bg-secondary">
                      {getInitials(assignee.user.name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {task.assignees.length > 3 && (
                  <div className="h-6 w-6 rounded-full border-2 border-card bg-secondary flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                    +{task.assignees.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // List variant
  return (
    <div
      className={cn(
        // Base styles
        'group relative flex items-start gap-4',
        'px-4 py-3.5',
        'transition-all duration-200 ease-out',
        // Hover: slight background fill
        'hover:bg-secondary/50 rounded-xl',
        // Cursor
        onClick && 'cursor-pointer',
        className
      )}
    >
      {/* Apple-style Checkbox */}
      <div className="flex-shrink-0 pt-0.5">
        <AppleCheckbox
          checked={isCompleted}
          onChange={handleCheckboxChange}
          size="md"
        />
      </div>

      {/* Main content */}
      <div
        className="flex-1 min-w-0"
        onClick={onClick}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Title & Meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {/* Status dot indicator */}
              <span
                className={cn('h-2 w-2 rounded-full flex-shrink-0', statusStyles.dot)}
              />
              <h4
                className={cn(
                  'text-[15px] font-medium leading-snug truncate',
                  isCompleted && 'line-through text-muted-foreground'
                )}
              >
                {task.title}
              </h4>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {/* Project info */}
              {task.project && (
                <span className="text-[12px] text-muted-foreground">
                  {task.project.dealCode} · {task.project.name}
                </span>
              )}

              {/* Status badge */}
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full',
                  statusStyles.bg,
                  statusStyles.text
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', statusStyles.dot)} />
                {AppleStatusLabels[task.status]}
              </span>

              {/* Priority badge */}
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full',
                  priorityStyles.bg,
                  priorityStyles.text
                )}
              >
                {ApplePriorityLabels[task.priority]}
              </span>

              {/* Due date with time */}
              {task.deadline && (
                <div
                  className={cn(
                    'flex items-center gap-1 text-[12px]',
                    isOverdue
                      ? 'text-[#ff3b30]'
                      : isDueToday
                        ? 'text-[#ff9f0a]'
                        : 'text-muted-foreground'
                  )}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {format(new Date(task.deadline), 'dd/MM/yyyy', { locale: vi })}
                    {hasTime(task.deadline) && ` ${format(new Date(task.deadline), 'HH:mm')}`}
                    {isOverdue && ' (Overdue)'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right side: Assignee avatars & Actions */}
          <div className="flex items-center gap-3">
            {/* Assignee avatars */}
            {task.assignees && task.assignees.length > 0 && (
              <div className="flex -space-x-2">
                {task.assignees.slice(0, 2).map((assignee) => (
                  <Avatar
                    key={assignee.id}
                    className="h-7 w-7 border-2 border-background"
                  >
                    {assignee.user.avatar ? (
                      <AvatarImage src={assignee.user.avatar} alt={assignee.user.name} />
                    ) : null}
                    <AvatarFallback className="text-[10px] bg-secondary">
                      {getInitials(assignee.user.name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {task.assignees.length > 2 && (
                  <div className="h-7 w-7 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                    +{task.assignees.length - 2}
                  </div>
                )}
              </div>
            )}

            {/* More actions menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'p-1.5 rounded-lg opacity-0 group-hover:opacity-100',
                    'transition-opacity duration-200',
                    'hover:bg-secondary'
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onStatusChange?.('TODO')}>
                  <span className="h-2 w-2 rounded-full bg-[#86868b] mr-2" />
                  Mark as To Do
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange?.('IN_PROGRESS')}>
                  <span className="h-2 w-2 rounded-full bg-[#007aff] mr-2" />
                  Mark as In Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange?.('PENDING')}>
                  <span className="h-2 w-2 rounded-full bg-[#ff9500] mr-2" />
                  Mark as Pending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange?.('REVIEW')}>
                  <span className="h-2 w-2 rounded-full bg-[#ff9f0a] mr-2" />
                  Mark as Review
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange?.('DONE')}>
                  <span className="h-2 w-2 rounded-full bg-[#34c759] mr-2" />
                  Mark as Done
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-[#ff3b30] focus:text-[#ff3b30]"
                  onClick={onDelete}
                >
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Task Card Skeleton for loading states
 */
export function TaskCardSkeleton({ variant = 'list' }: { variant?: 'list' | 'kanban' }) {
  if (variant === 'kanban') {
    return (
      <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-3">
        <div className="h-4 w-3/4 bg-secondary rounded animate-pulse" />
        <div className="flex gap-1.5">
          <div className="h-5 w-12 bg-secondary rounded-full animate-pulse" />
          <div className="h-5 w-14 bg-secondary rounded-full animate-pulse" />
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="h-4 w-16 bg-secondary rounded animate-pulse" />
          <div className="flex -space-x-1.5">
            <div className="h-6 w-6 bg-secondary rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-4 px-4 py-3.5">
      <div className="h-6 w-6 bg-secondary rounded-full animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 bg-secondary rounded animate-pulse" />
        <div className="flex gap-3">
          <div className="h-3 w-16 bg-secondary rounded animate-pulse" />
          <div className="h-5 w-14 bg-secondary rounded-full animate-pulse" />
          <div className="h-3 w-20 bg-secondary rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/**
 * Apple Design System - Task Design Tokens
 * ==========================================
 * Following Apple Human Interface Guidelines
 * Priority colors: urgent=#ff3b30, high=#ff9f0a, medium=#007aff, low=#34c759
 * Status colors: todo=#86868b, in_progress=#007aff, review=#ff9f0a, done=#34c759
 */

import { type TaskStatus, type TaskPriority } from './api/tasks';

// Apple HIG Priority Colors
export const ApplePriorityColors = {
  URGENT: {
    bg: 'bg-[#ff3b30]/10',
    text: 'text-[#ff3b30]',
    border: 'border-l-[#ff3b30]',
    dot: 'bg-[#ff3b30]',
    hex: '#ff3b30',
  },
  HIGH: {
    bg: 'bg-[#ff9f0a]/10',
    text: 'text-[#ff9f0a]',
    border: 'border-l-[#ff9f0a]',
    dot: 'bg-[#ff9f0a]',
    hex: '#ff9f0a',
  },
  MEDIUM: {
    bg: 'bg-[#007aff]/10',
    text: 'text-[#007aff]',
    border: 'border-l-[#007aff]',
    dot: 'bg-[#007aff]',
    hex: '#007aff',
  },
  LOW: {
    bg: 'bg-[#34c759]/10',
    text: 'text-[#34c759]',
    border: 'border-l-[#34c759]',
    dot: 'bg-[#34c759]',
    hex: '#34c759',
  },
} as const;

// Apple HIG Status Colors
export const AppleStatusColors = {
  TODO: {
    bg: 'bg-[#86868b]/10',
    text: 'text-[#86868b]',
    dot: 'bg-[#86868b]',
    hex: '#86868b',
  },
  IN_PROGRESS: {
    bg: 'bg-[#007aff]/10',
    text: 'text-[#007aff]',
    dot: 'bg-[#007aff]',
    hex: '#007aff',
  },
  PENDING: {
    bg: 'bg-[#ff9500]/10',
    text: 'text-[#ff9500]',
    dot: 'bg-[#ff9500]',
    hex: '#ff9500',
  },
  REVIEW: {
    bg: 'bg-[#ff9f0a]/10',
    text: 'text-[#ff9f0a]',
    dot: 'bg-[#ff9f0a]',
    hex: '#ff9f0a',
  },
  DONE: {
    bg: 'bg-[#34c759]/10',
    text: 'text-[#34c759]',
    dot: 'bg-[#34c759]',
    hex: '#34c759',
  },
  BLOCKED: {
    bg: 'bg-[#ff3b30]/10',
    text: 'text-[#ff3b30]',
    dot: 'bg-[#ff3b30]',
    hex: '#ff3b30',
  },
  CANCELLED: {
    bg: 'bg-[#86868b]/10',
    text: 'text-[#86868b]/60',
    dot: 'bg-[#86868b]/60',
    hex: '#86868b',
  },
} as const;

// Status Labels (Apple-style short labels)
export const AppleStatusLabels: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  PENDING: 'Pending',
  REVIEW: 'Review',
  DONE: 'Done',
  BLOCKED: 'Blocked',
  CANCELLED: 'Cancelled',
};

// Priority Labels
export const ApplePriorityLabels: Record<TaskPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

// Kanban Column Configuration
export const KanbanColumnConfig: Record<TaskStatus, { label: string; color: string }> = {
  TODO: { label: 'To Do', color: '#86868b' },
  IN_PROGRESS: { label: 'In Progress', color: '#007aff' },
  PENDING: { label: 'Pending', color: '#ff9500' },
  REVIEW: { label: 'Review', color: '#ff9f0a' },
  DONE: { label: 'Done', color: '#34c759' },
  BLOCKED: { label: 'Blocked', color: '#ff3b30' },
  CANCELLED: { label: 'Cancelled', color: '#86868b' },
};

// Helper functions
export function getPriorityStyles(priority: TaskPriority) {
  return ApplePriorityColors[priority];
}

export function getStatusStyles(status: TaskStatus) {
  return AppleStatusColors[status];
}

export function getStatusLabel(status: TaskStatus) {
  return AppleStatusLabels[status];
}

export function getPriorityLabel(priority: TaskPriority) {
  return ApplePriorityLabels[priority];
}

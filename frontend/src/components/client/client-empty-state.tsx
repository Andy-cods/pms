'use client';

import { LucideIcon, FolderKanban } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

/**
 * Client Empty State Component
 *
 * A clean, minimal empty state indicator.
 * Used when there's no data to display.
 */
export function ClientEmptyState({
  icon: Icon = FolderKanban,
  title,
  description,
  className,
}: ClientEmptyStateProps) {
  return (
    <div className={cn('client-empty', className)}>
      <Icon className="client-empty-icon" />
      <p className="client-empty-title">{title}</p>
      {description && (
        <p className="client-empty-description">{description}</p>
      )}
    </div>
  );
}

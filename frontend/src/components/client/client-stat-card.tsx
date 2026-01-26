'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ClientStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  className?: string;
}

/**
 * Client Stat Card Component
 *
 * A statistic card with Apple-inspired design for the client portal.
 * Features a prominent icon, large value, and descriptive label.
 */
export function ClientStatCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-[var(--client-primary)]',
  iconBgColor = 'bg-[var(--client-primary-light)]',
  className,
}: ClientStatCardProps) {
  return (
    <div className={cn('client-stat-card', className)}>
      <div className={cn('client-stat-icon', iconBgColor)}>
        <Icon className={cn('h-6 w-6', iconColor)} />
      </div>
      <div className="client-stat-value">{value}</div>
      <div className="client-stat-label">{title}</div>
    </div>
  );
}

'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  className?: string;
  onClick?: () => void;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
  onClick,
}: StatsCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) {
      return <TrendingUp className="h-3.5 w-3.5" />;
    } else if (trend.value < 0) {
      return <TrendingDown className="h-3.5 w-3.5" />;
    }
    return <Minus className="h-3.5 w-3.5" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value > 0) return 'text-emerald-600 dark:text-emerald-400';
    if (trend.value < 0) return 'text-red-500 dark:text-red-400';
    return 'text-muted-foreground';
  };

  return (
    <div
      className={cn(
        // Base styles - Apple-inspired floating card
        'group relative rounded-2xl bg-card p-6',
        // Subtle border that's almost invisible
        'border border-border/40',
        // Soft shadow with depth
        'shadow-[0_2px_8px_rgba(0,0,0,0.04)]',
        // Hover effect - slight lift with enhanced shadow
        'transition-all duration-300 ease-out',
        'hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]',
        'hover:-translate-y-0.5',
        // Click effect
        onClick && 'cursor-pointer active:scale-[0.98] active:shadow-[0_2px_8px_rgba(0,0,0,0.04)]',
        className
      )}
      onClick={onClick}
    >
      {/* Header with icon */}
      <div className="flex items-start justify-between mb-4">
        <span className="text-sm font-medium text-muted-foreground tracking-tight">
          {title}
        </span>
        {icon && (
          <div className="text-muted-foreground/60 transition-colors group-hover:text-muted-foreground">
            {icon}
          </div>
        )}
      </div>

      {/* Large prominent value */}
      <div className="mb-2">
        <span className="text-4xl font-semibold tracking-tight text-foreground tabular-nums">
          {value}
        </span>
      </div>

      {/* Subtitle and trend */}
      <div className="flex items-center justify-between">
        {subtitle && (
          <span className="text-sm text-muted-foreground">
            {subtitle}
          </span>
        )}

        {trend && (
          <div className={cn('flex items-center gap-1 text-xs font-medium', getTrendColor())}>
            {getTrendIcon()}
            <span>
              {trend.value > 0 && '+'}
              {trend.value}%
            </span>
            {trend.label && (
              <span className="text-muted-foreground font-normal ml-1">
                {trend.label}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Skeleton variant for loading state
export function StatsCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-card p-6 border border-border/40',
        'shadow-[0_2px_8px_rgba(0,0,0,0.04)]',
        'animate-pulse',
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="h-4 w-20 bg-muted rounded" />
        <div className="h-5 w-5 bg-muted rounded" />
      </div>
      <div className="mb-2">
        <div className="h-10 w-24 bg-muted rounded" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="h-4 w-16 bg-muted rounded" />
      </div>
    </div>
  );
}

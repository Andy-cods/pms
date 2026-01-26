'use client';

import { cn } from '@/lib/utils';

interface ClientProgressRingProps {
  progress: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const sizeConfig = {
  sm: {
    width: 80,
    height: 80,
    radius: 32,
    strokeWidth: 6,
    fontSize: 'text-lg',
    labelSize: 'text-[10px]',
  },
  md: {
    width: 120,
    height: 120,
    radius: 52,
    strokeWidth: 8,
    fontSize: 'text-2xl',
    labelSize: 'text-xs',
  },
  lg: {
    width: 160,
    height: 160,
    radius: 68,
    strokeWidth: 10,
    fontSize: 'text-4xl',
    labelSize: 'text-sm',
  },
};

/**
 * Client Progress Ring Component
 *
 * A circular progress indicator with Apple-inspired design.
 * Uses the client portal's teal accent color.
 */
export function ClientProgressRing({
  progress,
  size = 'md',
  showLabel = true,
  label = 'tien do',
  className,
}: ClientProgressRingProps) {
  const config = sizeConfig[size];
  const circumference = 2 * Math.PI * config.radius;
  const strokeDasharray = `${(progress / 100) * circumference} ${circumference}`;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={config.width}
        height={config.height}
        className="-rotate-90"
        viewBox={`0 0 ${config.width} ${config.height}`}
      >
        {/* Background circle */}
        <circle
          cx={config.width / 2}
          cy={config.height / 2}
          r={config.radius}
          fill="none"
          stroke="var(--surface)"
          strokeWidth={config.strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={config.width / 2}
          cy={config.height / 2}
          r={config.radius}
          fill="none"
          stroke="var(--client-primary)"
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-bold', config.fontSize)}>{progress}%</span>
        {showLabel && (
          <span className={cn('text-muted-foreground', config.labelSize)}>{label}</span>
        )}
      </div>
    </div>
  );
}

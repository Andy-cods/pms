'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppleCheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Apple-style Checkbox Component
 * - Rounded corners (rounded-full for circular, rounded-lg for rounded square)
 * - Green check color (#34c759) when checked
 * - Smooth 200ms transition
 * - Subtle border when unchecked
 */
export function AppleCheckbox({
  checked = false,
  onChange,
  disabled = false,
  className,
  size = 'md',
}: AppleCheckboxProps) {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-7 w-7',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        // Base styles
        'relative inline-flex items-center justify-center',
        'rounded-full border-2 transition-all duration-200 ease-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007aff] focus-visible:ring-offset-2',
        // Size
        sizeClasses[size],
        // Unchecked state
        !checked && 'border-[#d1d1d6] dark:border-[#48484a] bg-transparent',
        // Checked state - Apple green
        checked && 'border-[#34c759] bg-[#34c759]',
        // Disabled state
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'cursor-pointer hover:border-[#34c759]/70',
        className
      )}
    >
      {/* Checkmark icon with smooth animation */}
      <Check
        className={cn(
          iconSizes[size],
          'text-white transition-all duration-200 ease-out',
          checked ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        )}
        strokeWidth={3}
      />
    </button>
  );
}

/**
 * Apple-style Task Checkbox with completion animation
 */
interface TaskCheckboxProps extends AppleCheckboxProps {
  onComplete?: () => void;
}

export function TaskCheckbox({
  checked,
  onChange,
  onComplete,
  ...props
}: TaskCheckboxProps) {
  const handleChange = (newChecked: boolean) => {
    onChange?.(newChecked);
    if (newChecked) {
      onComplete?.();
    }
  };

  return <AppleCheckbox checked={checked} onChange={handleChange} {...props} />;
}

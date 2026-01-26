'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface AppleButtonProps extends React.ComponentProps<'button'> {
  variant?: 'primary' | 'secondary' | 'text';
  isLoading?: boolean;
  loadingText?: string;
}

const AppleButton = React.forwardRef<HTMLButtonElement, AppleButtonProps>(
  (
    {
      className,
      variant = 'primary',
      isLoading,
      loadingText,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          // Base styles
          'relative w-full h-12 px-6 rounded-xl font-medium text-base',
          'transition-all duration-200 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007AFF]/50',
          'disabled:cursor-not-allowed',
          // Active press effect
          'active:scale-[0.98]',
          // Variants
          variant === 'primary' && [
            'bg-[#007AFF] text-white',
            'hover:bg-[#0066CC]',
            'disabled:bg-[#007AFF]/50 disabled:text-white/70',
          ],
          variant === 'secondary' && [
            'bg-black/[0.05] dark:bg-white/[0.1] text-foreground',
            'hover:bg-black/[0.08] dark:hover:bg-white/[0.15]',
            'disabled:opacity-50',
          ],
          variant === 'text' && [
            'bg-transparent text-[#007AFF]',
            'hover:bg-[#007AFF]/5',
            'disabled:opacity-50',
          ],
          className
        )}
        {...props}
      >
        <span
          className={cn(
            'inline-flex items-center justify-center gap-2',
            isLoading && 'opacity-0'
          )}
        >
          {children}
        </span>
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center gap-2">
            <Loader2 className="size-5 animate-spin" />
            {loadingText && <span>{loadingText}</span>}
          </span>
        )}
      </button>
    );
  }
);

AppleButton.displayName = 'AppleButton';

export { AppleButton };

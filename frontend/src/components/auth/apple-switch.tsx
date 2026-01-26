'use client';

import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

interface AppleSwitchProps
  extends React.ComponentProps<typeof SwitchPrimitive.Root> {
  label?: string;
}

const AppleSwitch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  AppleSwitchProps
>(({ className, label, ...props }, ref) => {
  const id = React.useId();

  return (
    <div className="flex items-center gap-3">
      <SwitchPrimitive.Root
        ref={ref}
        id={id}
        className={cn(
          // Base - Apple toggle dimensions
          'peer inline-flex h-[26px] w-[46px] shrink-0 cursor-pointer items-center',
          'rounded-full border-2 border-transparent',
          // Background states
          'bg-black/[0.12] dark:bg-white/[0.16]',
          'data-[state=checked]:bg-[#34C759]',
          // Focus
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/50 focus-visible:ring-offset-2',
          // Disabled
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Transition
          'transition-colors duration-200',
          className
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            // Thumb styling - Apple circle
            'pointer-events-none block size-[22px] rounded-full',
            'bg-white shadow-lg',
            // Shadow for depth
            'shadow-[0_3px_8px_rgba(0,0,0,0.15),0_1px_1px_rgba(0,0,0,0.16)]',
            // Movement
            'transition-transform duration-200',
            'data-[state=checked]:translate-x-[20px]',
            'data-[state=unchecked]:translate-x-0'
          )}
        />
      </SwitchPrimitive.Root>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-normal text-foreground/80 cursor-pointer select-none"
        >
          {label}
        </label>
      )}
    </div>
  );
});

AppleSwitch.displayName = 'AppleSwitch';

export { AppleSwitch };

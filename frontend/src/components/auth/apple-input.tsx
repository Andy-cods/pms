'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

interface AppleInputProps extends React.ComponentProps<'input'> {
  label?: string;
  error?: string;
  showPasswordToggle?: boolean;
}

const AppleInput = React.forwardRef<HTMLInputElement, AppleInputProps>(
  ({ className, type, label, error, showPasswordToggle, autoFocus, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const localRef = React.useRef<HTMLInputElement | null>(null);

    // merge refs to keep forwardRef working
    const setRefs = (node: HTMLInputElement | null) => {
      localRef.current = node;
      if (!ref) return;
      if (typeof ref === 'function') {
        ref(node);
      } else {
        ref.current = node;
      }
    };

    React.useEffect(() => {
      if (autoFocus && localRef.current) {
        localRef.current.focus();
      }
    }, [autoFocus]);

    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium text-foreground/80 pl-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            type={inputType}
            ref={setRefs}
            className={cn(
              // Base styles - Apple pill shape
              'w-full h-12 px-4 rounded-xl text-base',
              // Background - subtle fill
              'bg-black/[0.04] dark:bg-white/[0.08]',
              // Border - none by default, subtle on focus
              'border-0 outline-none',
              // Focus ring - Apple blue glow
              'focus:ring-2 focus:ring-[#007AFF]/40 focus:bg-black/[0.06] dark:focus:bg-white/[0.12]',
              // Placeholder
              'placeholder:text-muted-foreground/60',
              // Transition
              'transition-all duration-200 ease-out',
              // Error state
              error && 'ring-2 ring-red-500/40 bg-red-500/5',
              // Password padding for toggle
              isPassword && showPasswordToggle && 'pr-12',
              className
            )}
            {...props}
          />
          {isPassword && showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg',
                'text-muted-foreground/60 hover:text-foreground/80',
                'transition-colors duration-150',
                'focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40 focus:ring-offset-0'
              )}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="size-5" />
              ) : (
                <Eye className="size-5" />
              )}
            </button>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-500 pl-1 animate-in fade-in slide-in-from-top-1 duration-200">
            {error}
          </p>
        )}
      </div>
    );
  }
);

AppleInput.displayName = 'AppleInput';

export { AppleInput };

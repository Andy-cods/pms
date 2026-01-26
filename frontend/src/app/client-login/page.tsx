'use client';

import { useState, type FormEvent, useMemo } from 'react';
import Link from 'next/link';
import { useClientLogin } from '@/hooks/use-auth';
import { AppleButton } from '@/components/auth';
import { cn } from '@/lib/utils';

export default function ClientLoginPage() {
  const [accessCode, setAccessCode] = useState('');
  const clientLoginMutation = useClientLogin();

  // Format access code with visual grouping (ABC-123 format) - derived state
  const formattedCode = useMemo(() => {
    const cleaned = accessCode.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (cleaned.length <= 3) {
      return cleaned;
    }
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}`;
  }, [accessCode]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove the dash for internal storage, only allow alphanumeric
    const value = e.target.value.replace(/[^A-Z0-9-]/gi, '').replace(/-/g, '').toUpperCase();
    if (value.length <= 6) {
      setAccessCode(value);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clientLoginMutation.mutate({ accessCode: accessCode.toUpperCase() });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50/80 dark:from-black dark:to-neutral-900/80 px-4 py-12 transition-colors duration-300">
      {/* Background decoration - teal gradient orbs for client portal */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#30D158]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#00C7BE]/5 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-[400px] space-y-8">
        {/* Logo and Header */}
        <div className="text-center space-y-4">
          {/* BC Agency Logo - teal gradient for client portal */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#30D158] to-[#00C7BE] shadow-lg shadow-[#30D158]/25 mb-2">
            <span className="text-2xl font-bold text-white">BC</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-[28px] font-semibold tracking-tight text-foreground">
              Client Portal
            </h1>
            <p className="text-base text-muted-foreground max-w-[300px] mx-auto">
              Theo doi tien do du an cua ban voi BC Agency
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl shadow-black/[0.03] dark:shadow-black/[0.3] border border-black/[0.04] dark:border-white/[0.06]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message - Apple style inline */}
            {clientLoginMutation.error && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="shrink-0 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400">
                  Ma truy cap khong hop le
                </p>
              </div>
            )}

            {/* Access Code Input - Special masked display */}
            <div className="space-y-2">
              <label
                htmlFor="accessCode"
                className="block text-sm font-medium text-foreground/80 pl-1"
              >
                Ma truy cap
              </label>

              {/* Masked code display boxes */}
              <div className="relative">
                <input
                  id="accessCode"
                  type="text"
                  value={formattedCode}
                  onChange={handleCodeChange}
                  placeholder="ABC-123"
                  autoComplete="off"
                  autoFocus
                  className={cn(
                    // Base styles
                    'w-full h-14 px-4 rounded-xl text-center',
                    'text-2xl font-mono tracking-[0.3em] uppercase',
                    // Background
                    'bg-black/[0.04] dark:bg-white/[0.08]',
                    // Border
                    'border-0 outline-none',
                    // Focus
                    'focus:ring-2 focus:ring-[#30D158]/40 focus:bg-black/[0.06] dark:focus:bg-white/[0.12]',
                    // Placeholder
                    'placeholder:text-muted-foreground/40 placeholder:tracking-[0.3em]',
                    // Transition
                    'transition-all duration-200 ease-out',
                    // Error
                    clientLoginMutation.error &&
                      'ring-2 ring-red-500/40 bg-red-500/5'
                  )}
                />
              </div>

              <p className="text-xs text-muted-foreground/70 pl-1">
                Ma truy cap duoc BC Agency cung cap cho cong ty ban
              </p>
            </div>

            {/* Submit Button - Teal for client portal */}
            <AppleButton
              type="submit"
              isLoading={clientLoginMutation.isPending}
              className="bg-[#30D158] hover:bg-[#28B94D] focus:ring-[#30D158]/50"
            >
              Truy cap Portal
            </AppleButton>
          </form>
        </div>

        {/* Help Section */}
        <div className="bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm rounded-2xl p-5 border border-black/[0.04] dark:border-white/[0.06]">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-[#30D158]/10 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[#30D158]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground/90">
                Ban chua co ma truy cap?
              </p>
              <p className="text-sm text-muted-foreground">
                Lien he{' '}
                <a
                  href="mailto:support@bcagency.com"
                  className="text-[#30D158] hover:text-[#28B94D] transition-colors"
                >
                  support@bcagency.com
                </a>{' '}
                de duoc ho tro.
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-black/[0.06] dark:border-white/[0.06]" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 text-sm text-muted-foreground bg-gradient-to-b from-white to-gray-50/80 dark:from-black dark:to-neutral-900/80">
              hoac
            </span>
          </div>
        </div>

        {/* Staff Login Link */}
        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-[#007AFF] hover:text-[#0066CC] transition-colors group"
          >
            <svg
              className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Dang nhap cho nhan vien BC Agency</span>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/60 pt-4">
          &copy; 2026 BC Agency. All rights reserved.
        </p>
      </div>
    </div>
  );
}

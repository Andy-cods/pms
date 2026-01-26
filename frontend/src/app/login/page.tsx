'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useLogin } from '@/hooks/use-auth';
import { AppleInput, AppleButton, AppleSwitch } from '@/components/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const loginMutation = useLogin();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50/80 dark:from-black dark:to-neutral-900/80 px-4 py-12 transition-colors duration-300">
      {/* Background decoration - subtle gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#007AFF]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#5856D6]/5 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-[400px] space-y-8">
        {/* Logo and Header */}
        <div className="text-center space-y-4">
          {/* BC Agency Logo */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] shadow-lg shadow-[#007AFF]/25 mb-2">
            <span className="text-2xl font-bold text-white">BC</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-[28px] font-semibold tracking-tight text-foreground">
              Chào mừng trở lại
            </h1>
            <p className="text-base text-muted-foreground">
              Đăng nhập vào hệ thống quản lý dự án
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl shadow-black/[0.03] dark:shadow-black/[0.3] border border-black/[0.04] dark:border-white/[0.06]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message - Apple style inline */}
            {loginMutation.error && (
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
                  Email hoặc mật khẩu không đúng
                </p>
              </div>
            )}

            {/* Email Input */}
            <AppleInput
              id="email"
              type="email"
              label="Email"
              placeholder="email@bcagency.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />

            {/* Password Input */}
            <AppleInput
              id="password"
              type="password"
              label="Mat khau"
              placeholder="Nhap mat khau"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              showPasswordToggle
            />

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <AppleSwitch
                checked={rememberMe}
                onCheckedChange={setRememberMe}
                label="Ghi nhớ đăng nhập"
              />
              <Link
                href="#"
                className="text-sm text-[#007AFF] hover:text-[#0066CC] transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <AppleButton
                type="submit"
                variant="primary"
                isLoading={loginMutation.isPending}
              >
                Đăng nhập
              </AppleButton>
            </div>
          </form>
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

        {/* Client Portal Link */}
        <div className="text-center">
          <Link
            href="/client-login"
            className="inline-flex items-center gap-2 text-sm text-[#007AFF] hover:text-[#0066CC] transition-colors group"
          >
            <span>Đăng nhập với tư cách Khách hàng</span>
            <svg
              className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/60 pt-4">
          &copy; 2026 BC Agency. Đã đăng ký bản quyền.
        </p>
      </div>
    </div>
  );
}

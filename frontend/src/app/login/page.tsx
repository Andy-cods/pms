'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useLogin } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const loginMutation = useLogin();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">BC Agency PMS</h1>
          <h2 className="mt-2 text-xl font-semibold text-gray-700">Đăng nhập</h2>
          <p className="mt-2 text-sm text-gray-600">Hệ thống quản lý dự án nội bộ</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6 rounded-xl bg-white p-8 shadow-lg">
          {loginMutation.error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
              Email hoặc mật khẩu không đúng. Vui lòng thử lại.
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="email@bcagency.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />

            <Input
              label="Mật khẩu"
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-600">Ghi nhớ đăng nhập</span>
            </label>
            <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              Quên mật khẩu?
            </a>
          </div>

          <Button type="submit" className="w-full" size="lg" isLoading={loginMutation.isPending}>
            Đăng nhập
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">hoặc</span>
            </div>
          </div>

          <div className="text-center">
            <Link href="/client-login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              Đăng nhập với tư cách Khách hàng
            </Link>
          </div>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">&copy; 2026 BC Agency. All rights reserved.</p>
      </div>
    </div>
  );
}

'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useClientLogin } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ClientLoginPage() {
  const [accessCode, setAccessCode] = useState('');
  const clientLoginMutation = useClientLogin();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clientLoginMutation.mutate({ accessCode: accessCode.toUpperCase() });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">BC Agency PMS</h1>
          <h2 className="mt-2 text-xl font-semibold text-gray-700">Client Portal</h2>
          <p className="mt-2 text-sm text-gray-600">Xem tiến độ dự án của bạn</p>
        </div>

        {/* Client Login Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6 rounded-xl bg-white p-8 shadow-lg">
          {clientLoginMutation.error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
              Mã truy cập không hợp lệ. Vui lòng kiểm tra lại.
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Mã truy cập"
              type="text"
              placeholder="VD: ABC123"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              required
              autoComplete="off"
              autoFocus
              className="text-center text-lg font-mono tracking-widest uppercase"
              helperText="Mã truy cập được BC Agency cung cấp cho công ty bạn"
            />
          </div>

          <Button type="submit" className="w-full" size="lg" isLoading={clientLoginMutation.isPending}>
            Truy cập Portal
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
            <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              Đăng nhập cho nhân viên BC Agency
            </Link>
          </div>
        </form>

        {/* Help Section */}
        <div className="rounded-lg bg-white/50 p-4 text-center text-sm text-gray-600">
          <p>
            Bạn chưa có mã truy cập?{' '}
            <a href="mailto:support@bcagency.com" className="font-medium text-blue-600 hover:text-blue-500">
              Liên hệ BC Agency
            </a>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">&copy; 2026 BC Agency. All rights reserved.</p>
      </div>
    </div>
  );
}

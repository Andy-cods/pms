'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { UserRoleLabels } from '@/types';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold text-gray-900">BC Agency PMS</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{UserRoleLabels[user.role]}</p>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Xin chào, {user.name}!</h2>
          <p className="text-gray-600">Chào mừng bạn đến với hệ thống quản lý dự án BC Agency.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-500">Dự án đang chạy</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">--</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-500">Tasks của tôi</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">--</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-500">Chờ duyệt</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">--</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-500">Thông báo</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">--</p>
          </div>
        </div>

        {/* Placeholder Content */}
        <div className="mt-8 rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-500">Dashboard content sẽ được phát triển trong các phase tiếp theo.</p>
          <p className="mt-2 text-sm text-gray-400">Phase 2 - Week 4: Dashboard & Analytics</p>
        </div>
      </main>
    </div>
  );
}

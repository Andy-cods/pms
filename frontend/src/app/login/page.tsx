'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useLogin } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const loginMutation = useLogin();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">BC Agency PMS</h1>
          <h2 className="mt-2 text-xl font-semibold text-muted-foreground">Đăng nhập</h2>
          <p className="mt-2 text-sm text-muted-foreground">Hệ thống quản lý dự án nội bộ</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6 rounded-xl bg-card p-8 shadow-lg border">
          {loginMutation.error && (
            <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
              Email hoặc mật khẩu không đúng. Vui lòng thử lại.
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@bcagency.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox id="remember" />
              <Label htmlFor="remember" className="text-sm font-normal">
                Ghi nhớ đăng nhập
              </Label>
            </div>
            <a href="#" className="text-sm font-medium text-primary hover:underline">
              Quên mật khẩu?
            </a>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loginMutation.isPending}>
            {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Đăng nhập
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-4 text-muted-foreground">hoặc</span>
            </div>
          </div>

          <div className="text-center">
            <Link href="/client-login" className="text-sm font-medium text-primary hover:underline">
              Đăng nhập với tư cách Khách hàng
            </Link>
          </div>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">&copy; 2026 BC Agency. All rights reserved.</p>
      </div>
    </div>
  );
}

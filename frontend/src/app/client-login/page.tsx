'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useClientLogin } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ClientLoginPage() {
  const [accessCode, setAccessCode] = useState('');
  const clientLoginMutation = useClientLogin();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clientLoginMutation.mutate({ accessCode: accessCode.toUpperCase() });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-primary/20 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">BC Agency PMS</h1>
          <h2 className="mt-2 text-xl font-semibold text-muted-foreground">Client Portal</h2>
          <p className="mt-2 text-sm text-muted-foreground">Xem tiến độ dự án của bạn</p>
        </div>

        {/* Client Login Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6 rounded-xl bg-card p-8 shadow-lg border">
          {clientLoginMutation.error && (
            <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
              Mã truy cập không hợp lệ. Vui lòng kiểm tra lại.
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accessCode">Mã truy cập</Label>
              <Input
                id="accessCode"
                type="text"
                placeholder="VD: ABC123"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                required
                autoComplete="off"
                autoFocus
                className="text-center text-lg font-mono tracking-widest uppercase"
              />
              <p className="text-xs text-muted-foreground">
                Mã truy cập được BC Agency cung cấp cho công ty bạn
              </p>
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={clientLoginMutation.isPending}>
            {clientLoginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Truy cập Portal
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
            <Link href="/login" className="text-sm font-medium text-primary hover:underline">
              Đăng nhập cho nhân viên BC Agency
            </Link>
          </div>
        </form>

        {/* Help Section */}
        <div className="rounded-lg bg-card/50 p-4 text-center text-sm text-muted-foreground border">
          <p>
            Bạn chưa có mã truy cập?{' '}
            <a href="mailto:support@bcagency.com" className="font-medium text-primary hover:underline">
              Liên hệ BC Agency
            </a>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">&copy; 2026 BC Agency. All rights reserved.</p>
      </div>
    </div>
  );
}

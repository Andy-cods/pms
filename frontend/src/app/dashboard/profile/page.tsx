'use client';

import type React from 'react';
import { ShieldCheck, Mail, IdCard, UserCircle2, LogOut, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { UserRoleLabels } from '@/types';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Tài khoản</p>
          <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
            <UserCircle2 className="h-7 w-7 text-primary" />
            Hồ sơ cá nhân
          </h1>
          <p className="text-muted-foreground">
            Kiểm tra thông tin đăng nhập, vai trò và hoạt động bảo mật của bạn.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={logout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </Button>
        </div>
      </div>

      {/* Profile */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-sm border-border/70">
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.avatar || undefined} alt={user?.name} />
              <AvatarFallback>{initials || 'U'}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <CardTitle className="text-2xl">{user?.name || 'Người dùng'}</CardTitle>
              <p className="text-muted-foreground">{user?.email}</p>
              {user?.role && (
                <Badge variant="outline" className="capitalize">
                  {UserRoleLabels[user.role]}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <InfoRow
                icon={<Mail className="h-4 w-4 text-primary" />}
                label="Email đăng nhập"
                value={user?.email || '—'}
              />
              <InfoRow
                icon={<IdCard className="h-4 w-4 text-primary" />}
                label="Mã người dùng"
                value={user?.id || '—'}
              />
              <InfoRow
                icon={<ShieldCheck className="h-4 w-4 text-primary" />}
                label="Trạng thái"
                value="Đang hoạt động"
              />
              <InfoRow
                icon={<Sparkles className="h-4 w-4 text-primary" />}
                label="Ngày tham gia"
                value={
                  user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('vi-VN')
                    : '—'
                }
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium">Bảo mật & phiên đăng nhập</p>
              <p className="text-sm text-muted-foreground">
                Các thiết lập chỉnh sửa hồ sơ và đổi mật khẩu sẽ sớm có mặt. Hiện tại bạn có
                thể đăng xuất để làm mới phiên.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/70">
          <CardHeader>
            <CardTitle>Các bước tiếp theo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>• Giữ thông tin liên hệ cập nhật để nhóm dễ dàng trao đổi.</p>
            <p>• Sử dụng menu trên để chuyển nhanh tới Dashboard hoặc Tasks.</p>
            <p>• Nếu cần thay đổi quyền, liên hệ quản trị viên.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 px-3 py-3">
      <div className="rounded-lg bg-primary/10 p-2">{icon}</div>
      <div className="space-y-0.5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground break-all">{value}</p>
      </div>
    </div>
  );
}

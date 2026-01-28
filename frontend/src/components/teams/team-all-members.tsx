'use client';

import { useState } from 'react';
import {
  MoreHorizontal,
  KeyRound,
  UserX,
  UserCheck,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { UserRole, UserRoleLabels } from '@/types';
import type { AdminUserWithWorkload } from '@/lib/api/admin-users';
import {
  useUpdateAdminUser,
  useDeactivateAdminUser,
  useResetAdminUserPassword,
} from '@/hooks/use-admin-users';

const ALL_ROLES = Object.values(UserRole);

interface TeamAllMembersProps {
  users: AdminUserWithWorkload[];
  currentUserRole?: string;
}

export function TeamAllMembers({ users, currentUserRole }: TeamAllMembersProps) {
  const updateUser = useUpdateAdminUser();
  const deactivateUser = useDeactivateAdminUser();
  const resetPassword = useResetAdminUserPassword();
  const [tempPasswordDialog, setTempPasswordDialog] = useState<{
    open: boolean;
    userName: string;
    password: string;
  }>({ open: false, userName: '', password: '' });
  const [copied, setCopied] = useState(false);

  const isAdmin = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN';

  const handleRoleChange = (userId: string, newRole: string) => {
    updateUser.mutate({ id: userId, input: { role: newRole as UserRole } });
  };

  const handleToggleActive = (userId: string, isActive: boolean) => {
    if (!isActive) {
      // Re-activate
      updateUser.mutate({ id: userId, input: { isActive: true } });
    } else {
      deactivateUser.mutate(userId);
    }
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    try {
      const result = await resetPassword.mutateAsync(userId);
      setTempPasswordDialog({
        open: true,
        userName,
        password: result.tempPassword,
      });
    } catch {
      // error handled by hook
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(tempPasswordDialog.password);
    setCopied(true);
    toast.success('Đã sao chép mật khẩu');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {users.map((user) => {
          const initials = user.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
          const w = user.workload;

          return (
            <Card key={user.id} className="border-border/70 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={user.avatar || undefined} alt={user.name} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{user.name}</span>
                      {!user.isActive && (
                        <Badge variant="secondary" className="text-[10px] px-1.5">Ngưng</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>

                  {/* Role badge or dropdown */}
                  {isAdmin ? (
                    <Select
                      value={user.role}
                      onValueChange={(v) => handleRoleChange(user.id, v)}
                    >
                      <SelectTrigger className="w-[130px] h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_ROLES.map((r) => (
                          <SelectItem key={r} value={r} className="text-xs">
                            {UserRoleLabels[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline" className="text-xs shrink-0">
                      {UserRoleLabels[user.role as UserRole] || user.role}
                    </Badge>
                  )}

                  {/* Quick actions */}
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleToggleActive(user.id, user.isActive)}>
                          {user.isActive ? (
                            <>
                              <UserX className="h-4 w-4 mr-2" />
                              Vô hiệu hóa
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Kích hoạt lại
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleResetPassword(user.id, user.name)}>
                          <KeyRound className="h-4 w-4 mr-2" />
                          Đặt lại mật khẩu
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Workload stats */}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{w.totalTasks} tasks · {w.projectCount} dự án</span>
                    <span className="font-medium">
                      {w.completionPercent}%
                    </span>
                  </div>
                  <Progress value={w.completionPercent} className="h-1.5" />
                  {w.overdueTasks > 0 && (
                    <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-3 w-3" />
                      {w.overdueTasks} quá hạn
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {users.length === 0 && (
          <Card className="col-span-full border-dashed border-2">
            <CardContent className="py-10 text-center text-muted-foreground">
              Không tìm thấy thành viên phù hợp.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Temp password dialog */}
      <Dialog
        open={tempPasswordDialog.open}
        onOpenChange={(open) => {
          if (!open) setTempPasswordDialog({ open: false, userName: '', password: '' });
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mật khẩu tạm thời</DialogTitle>
            <DialogDescription>
              Mật khẩu mới cho <strong>{tempPasswordDialog.userName}</strong>. Sao chép và gửi cho người dùng.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 mt-2">
            <code className="flex-1 px-3 py-2 rounded-lg bg-muted text-sm font-mono select-all">
              {tempPasswordDialog.password}
            </code>
            <Button size="icon" variant="outline" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Mật khẩu này chỉ hiển thị một lần. Hãy sao chép ngay.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}

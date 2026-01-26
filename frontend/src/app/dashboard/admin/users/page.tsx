'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  Pencil,
  KeyRound,
  UserMinus,
  UserCheck,
  Copy,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import {
  useAdminUsers,
  useCreateAdminUser,
  useUpdateAdminUser,
  useDeactivateAdminUser,
  useResetAdminUserPassword,
} from '@/hooks/use-admin-users';
import { UserFormModal } from '@/components/admin/user-form-modal';
import type { AdminUser, CreateUserInput, UpdateUserInput, UserRole } from '@/lib/api/admin-users';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  TECHNICAL: 'Technical',
  NVKD: 'NVKD',
  PM: 'PM',
  PLANNER: 'Planner',
  ACCOUNT: 'Account',
  CONTENT: 'Content',
  DESIGN: 'Design',
  MEDIA: 'Media',
};

const ROLE_COLORS: Record<UserRole, string> = {
  SUPER_ADMIN: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  ADMIN: 'bg-red-500/10 text-red-600 dark:text-red-400',
  TECHNICAL: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  NVKD: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  PM: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  PLANNER: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  ACCOUNT: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  CONTENT: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  DESIGN: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  MEDIA: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
};

type FilterType = 'all' | 'active' | 'inactive' | UserRole;

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'Tat ca' },
  { value: 'active', label: 'Hoat dong' },
  { value: 'inactive', label: 'Vo hieu' },
];

const ROLE_FILTERS: { value: UserRole; label: string }[] = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'PM', label: 'PM' },
  { value: 'TECHNICAL', label: 'Technical' },
  { value: 'DESIGN', label: 'Design' },
  { value: 'CONTENT', label: 'Content' },
];

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState<AdminUser | null>(null);
  const [resettingPasswordUser, setResettingPasswordUser] = useState<AdminUser | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  // Determine role and status filters from activeFilter
  const roleFilter = Object.keys(ROLE_LABELS).includes(activeFilter) ? activeFilter as UserRole : undefined;
  const statusFilter = activeFilter === 'active' ? true : activeFilter === 'inactive' ? false : undefined;

  const { data, isLoading } = useAdminUsers({
    search: searchQuery || undefined,
    role: roleFilter,
    isActive: statusFilter,
  });

  const createMutation = useCreateAdminUser();
  const updateMutation = useUpdateAdminUser();
  const deactivateMutation = useDeactivateAdminUser();
  const resetPasswordMutation = useResetAdminUserPassword();

  const handleCreateSubmit = async (formData: CreateUserInput | UpdateUserInput) => {
    await createMutation.mutateAsync(formData as CreateUserInput);
  };

  const handleEditSubmit = async (formData: CreateUserInput | UpdateUserInput) => {
    if (!editingUser) return;
    await updateMutation.mutateAsync({
      id: editingUser.id,
      input: formData as UpdateUserInput,
    });
  };

  const handleDeactivate = async () => {
    if (!deactivatingUser) return;
    await deactivateMutation.mutateAsync(deactivatingUser.id);
    setDeactivatingUser(null);
  };

  const handleToggleActive = async (user: AdminUser) => {
    if (user.isActive) {
      setDeactivatingUser(user);
    } else {
      await updateMutation.mutateAsync({
        id: user.id,
        input: { isActive: true },
      });
    }
  };

  const handleResetPassword = async () => {
    if (!resettingPasswordUser) return;
    const result = await resetPasswordMutation.mutateAsync(resettingPasswordUser.id);
    setTempPassword(result.tempPassword);
  };

  const copyTempPassword = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      toast.success('Da copy mat khau tam thoi');
    }
  };

  const closeTempPasswordDialog = () => {
    setResettingPasswordUser(null);
    setTempPassword(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLastLogin = (date: string | null) => {
    if (!date) return 'Chua dang nhap';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Vua xong';
    if (diffMins < 60) return `${diffMins} phut truoc`;
    if (diffHours < 24) return `${diffHours} gio truoc`;
    if (diffDays < 7) return `${diffDays} ngay truoc`;
    return d.toLocaleDateString('vi-VN');
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>

        {/* Search & Filter Skeleton */}
        <div className="flex gap-3">
          <Skeleton className="h-11 flex-1 max-w-md" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-9 w-20 rounded-full" />
            ))}
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-border/30 last:border-0">
              <Skeleton className="h-11 w-11 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nguoi dung</h1>
          <p className="text-muted-foreground mt-1">
            Quan ly {data?.total || 0} tai khoan trong he thong
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 transition-all shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Them nguoi dung
        </Button>
      </div>

      {/* Search & Filter Pills */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tim kiem nguoi dung..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-11 rounded-xl bg-surface border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all',
                activeFilter === filter.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-surface hover:bg-muted text-foreground/80'
              )}
            >
              {filter.label}
            </button>
          ))}
          <div className="w-px h-8 bg-border/50 mx-1 self-center" />
          {ROLE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(activeFilter === filter.value ? 'all' : filter.value)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all',
                activeFilter === filter.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-surface hover:bg-muted text-foreground/80'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table - Apple Style */}
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
        {/* Table Header */}
        <div className="grid grid-cols-[1fr,1.2fr,auto,auto,auto] gap-4 px-5 py-3 bg-surface/50 border-b border-border/30 text-sm font-medium text-muted-foreground">
          <span>Nguoi dung</span>
          <span>Email</span>
          <span className="text-center w-24">Vai tro</span>
          <span className="text-center w-20">Trang thai</span>
          <span className="w-24"></span>
        </div>

        {/* Table Body */}
        {data?.users && data.users.length > 0 ? (
          <div className="divide-y divide-border/30">
            {data.users.map((user, index) => (
              <div
                key={user.id}
                className={cn(
                  'grid grid-cols-[1fr,1.2fr,auto,auto,auto] gap-4 px-5 py-4 items-center transition-colors hover:bg-surface/50',
                  index % 2 === 1 && 'bg-surface/30'
                )}
              >
                {/* User Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-11 w-11 ring-2 ring-border/50">
                    <AvatarImage src={user.avatar || undefined} alt={user.name} />
                    <AvatarFallback className="text-sm font-medium bg-surface">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatLastLogin(user.lastLoginAt)}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <span className="text-muted-foreground truncate">{user.email}</span>

                {/* Role Badge */}
                <div className="w-24 flex justify-center">
                  <Badge
                    variant="secondary"
                    className={cn(
                      'font-medium text-xs px-2.5 py-0.5 rounded-full',
                      ROLE_COLORS[user.role]
                    )}
                  >
                    {ROLE_LABELS[user.role]}
                  </Badge>
                </div>

                {/* Status Dot */}
                <div className="w-20 flex justify-center">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'h-2.5 w-2.5 rounded-full',
                        user.isActive
                          ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                          : 'bg-gray-400'
                      )}
                    />
                    <span className="text-xs text-muted-foreground">
                      {user.isActive ? 'On' : 'Off'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="w-24 flex justify-end gap-1">
                  <button
                    onClick={() => setEditingUser(user)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title="Chinh sua"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setResettingPasswordUser(user)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title="Dat lai mat khau"
                  >
                    <KeyRound className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(user)}
                    disabled={user.id === currentUser?.id}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      user.id === currentUser?.id
                        ? 'opacity-30 cursor-not-allowed'
                        : user.isActive
                          ? 'hover:bg-red-500/10 text-muted-foreground hover:text-red-600'
                          : 'hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600'
                    )}
                    title={user.isActive ? 'Vo hieu hoa' : 'Kich hoat'}
                  >
                    {user.isActive ? (
                      <UserMinus className="h-4 w-4" />
                    ) : (
                      <UserCheck className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
              <Search className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground">Khong tim thay nguoi dung</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery || activeFilter !== 'all'
                ? 'Thu thay doi bo loc hoac tu khoa tim kiem'
                : 'Chua co nguoi dung nao trong he thong'}
            </p>
            {!searchQuery && activeFilter === 'all' && (
              <Button
                variant="outline"
                className="mt-4 rounded-xl"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Them nguoi dung dau tien
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {data?.total !== undefined && data.total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Hien thi {data.users?.length || 0} / {data.total} nguoi dung</span>
        </div>
      )}

      {/* Create Modal */}
      <UserFormModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSubmit={handleCreateSubmit}
        isSubmitting={createMutation.isPending}
        currentUserRole={currentUser?.role as UserRole}
      />

      {/* Edit Modal */}
      <UserFormModal
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        user={editingUser}
        onSubmit={handleEditSubmit}
        isSubmitting={updateMutation.isPending}
        currentUserRole={currentUser?.role as UserRole}
      />

      {/* Deactivate Confirmation */}
      <AlertDialog
        open={!!deactivatingUser}
        onOpenChange={(open) => !open && setDeactivatingUser(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Vo hieu hoa nguoi dung?</AlertDialogTitle>
            <AlertDialogDescription>
              Nguoi dung &quot;{deactivatingUser?.name}&quot; se khong the dang nhap vao he thong sau khi bi vo hieu hoa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Huy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Vo hieu hoa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={!!resettingPasswordUser}
        onOpenChange={(open) => !open && closeTempPasswordDialog()}
      >
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {tempPassword ? 'Mat khau tam thoi' : 'Dat lai mat khau?'}
            </DialogTitle>
            <DialogDescription>
              {tempPassword ? (
                <>Mat khau moi cho &quot;{resettingPasswordUser?.name}&quot;:</>
              ) : (
                <>
                  Mat khau moi se duoc tao tu dong cho &quot;{resettingPasswordUser?.name}&quot;.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {tempPassword && (
            <div className="flex items-center gap-3 p-4 bg-surface rounded-xl border border-border/50">
              <code className="flex-1 text-lg font-mono font-medium tracking-wider">
                {tempPassword}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={copyTempPassword}
                className="rounded-lg hover:bg-muted"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}

          {tempPassword && (
            <p className="text-sm text-muted-foreground bg-amber-500/10 text-amber-600 dark:text-amber-400 p-3 rounded-xl">
              Luu y: Mat khau nay chi hien thi mot lan. Vui long copy va gui cho nguoi dung.
            </p>
          )}

          <DialogFooter>
            {tempPassword ? (
              <Button onClick={closeTempPasswordDialog} className="rounded-xl w-full">
                Dong
              </Button>
            ) : (
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={closeTempPasswordDialog}
                  className="rounded-xl flex-1"
                >
                  Huy
                </Button>
                <Button
                  onClick={handleResetPassword}
                  disabled={resetPasswordMutation.isPending}
                  className="rounded-xl flex-1"
                >
                  {resetPasswordMutation.isPending ? 'Dang xu ly...' : 'Dat lai'}
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  KeyRound,
  UserX,
  Check,
  X,
  Copy,
  Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  TECHNICAL: 'Technical',
  NVKD: 'NVKD (Sales)',
  PM: 'Project Manager',
  PLANNER: 'Planner',
  ACCOUNT: 'Account',
  CONTENT: 'Content',
  DESIGN: 'Design',
  MEDIA: 'Media',
};

const ROLE_COLORS: Record<UserRole, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-red-100 text-red-800',
  TECHNICAL: 'bg-blue-100 text-blue-800',
  NVKD: 'bg-yellow-100 text-yellow-800',
  PM: 'bg-green-100 text-green-800',
  PLANNER: 'bg-cyan-100 text-cyan-800',
  ACCOUNT: 'bg-orange-100 text-orange-800',
  CONTENT: 'bg-pink-100 text-pink-800',
  DESIGN: 'bg-indigo-100 text-indigo-800',
  MEDIA: 'bg-teal-100 text-teal-800',
};

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState<AdminUser | null>(null);
  const [resettingPasswordUser, setResettingPasswordUser] = useState<AdminUser | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const { data, isLoading } = useAdminUsers({
    search: searchQuery || undefined,
    role: roleFilter !== 'all' ? (roleFilter as UserRole) : undefined,
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
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
      // If active, show deactivate confirmation
      setDeactivatingUser(user);
    } else {
      // If inactive, directly activate
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quan ly nguoi dung</h1>
          <p className="text-muted-foreground">Quan ly tai khoan nguoi dung trong he thong</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Them nguoi dung
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tim theo ten hoac email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Vai tro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tat ca vai tro</SelectItem>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Trang thai" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tat ca</SelectItem>
            <SelectItem value="active">Hoat dong</SelectItem>
            <SelectItem value="inactive">Vo hieu</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nguoi dung</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Vai tro</TableHead>
                <TableHead>Trang thai</TableHead>
                <TableHead>Dang nhap gan nhat</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.users && data.users.length > 0 ? (
                data.users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar || undefined} alt={user.name} />
                          <AvatarFallback className="text-xs">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={ROLE_COLORS[user.role]}>
                        {ROLE_LABELS[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.isActive ? 'default' : 'secondary'}
                        className={user.isActive ? 'bg-green-100 text-green-800' : ''}
                      >
                        {user.isActive ? 'Hoat dong' : 'Vo hieu'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleString('vi-VN')
                        : 'Chua dang nhap'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingUser(user)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Chinh sua
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setResettingPasswordUser(user)}>
                            <KeyRound className="h-4 w-4 mr-2" />
                            Dat lai mat khau
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleToggleActive(user)}
                            disabled={user.id === currentUser?.id}
                          >
                            {user.isActive ? (
                              <>
                                <UserX className="h-4 w-4 mr-2" />
                                Vo hieu hoa
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Kich hoat
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto" />
                    <p className="mt-2 text-muted-foreground">
                      {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                        ? 'Khong tim thay nguoi dung'
                        : 'Chua co nguoi dung nao'}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Total count */}
      {data?.total !== undefined && (
        <div className="text-sm text-muted-foreground">
          Tong cong: {data.total} nguoi dung
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vo hieu hoa nguoi dung?</AlertDialogTitle>
            <AlertDialogDescription>
              Ban co chac muon vo hieu hoa nguoi dung &quot;{deactivatingUser?.name}&quot;?
              Nguoi dung se khong the dang nhap vao he thong.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              className="bg-destructive text-destructive-foreground"
            >
              Vo hieu hoa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Confirmation/Result */}
      <Dialog
        open={!!resettingPasswordUser}
        onOpenChange={(open) => !open && closeTempPasswordDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {tempPassword ? 'Mat khau tam thoi' : 'Dat lai mat khau?'}
            </DialogTitle>
            <DialogDescription>
              {tempPassword ? (
                <>Mat khau moi cho nguoi dung &quot;{resettingPasswordUser?.name}&quot;:</>
              ) : (
                <>
                  Ban co chac muon dat lai mat khau cho nguoi dung &quot;
                  {resettingPasswordUser?.name}&quot;? Mat khau moi se duoc tao tu dong.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {tempPassword && (
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
              <code className="flex-1 text-lg font-mono">{tempPassword}</code>
              <Button variant="outline" size="icon" onClick={copyTempPassword}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}

          {tempPassword && (
            <p className="text-sm text-muted-foreground">
              Vui long sao chep va gui mat khau nay cho nguoi dung. Mat khau se khong duoc hien thi lai.
            </p>
          )}

          <DialogFooter>
            {tempPassword ? (
              <Button onClick={closeTempPasswordDialog}>Dong</Button>
            ) : (
              <>
                <Button variant="outline" onClick={closeTempPasswordDialog}>
                  Huy
                </Button>
                <Button
                  onClick={handleResetPassword}
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending ? 'Dang xu ly...' : 'Dat lai mat khau'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Copy,
  RefreshCw,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  useClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  useRegenerateClientCode,
} from '@/hooks/use-admin';
import type { Client, CreateClientInput, UpdateClientInput } from '@/lib/api/admin';

export default function AdminClientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  const { data, isLoading } = useClients({ search: searchQuery || undefined });
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const deleteMutation = useDeleteClient();
  const regenerateMutation = useRegenerateClientCode();

  const [formData, setFormData] = useState<CreateClientInput>({
    companyName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
  });

  const handleCreateSubmit = async () => {
    if (!formData.companyName.trim()) return;
    await createMutation.mutateAsync(formData);
    setShowCreateDialog(false);
    setFormData({ companyName: '', contactName: '', contactEmail: '', contactPhone: '' });
  };

  const handleEditSubmit = async () => {
    if (!editingClient || !formData.companyName.trim()) return;
    await updateMutation.mutateAsync({
      id: editingClient.id,
      input: formData as UpdateClientInput,
    });
    setEditingClient(null);
  };

  const handleDelete = async () => {
    if (!deletingClient) return;
    await deleteMutation.mutateAsync(deletingClient.id);
    setDeletingClient(null);
  };

  const handleToggleActive = async (client: Client) => {
    await updateMutation.mutateAsync({
      id: client.id,
      input: { isActive: !client.isActive },
    });
  };

  const handleRegenerateCode = async (id: string) => {
    await regenerateMutation.mutateAsync(id);
  };

  const copyAccessCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Đã copy mã truy cập');
  };

  const openEditDialog = (client: Client) => {
    setFormData({
      companyName: client.companyName,
      contactName: client.contactName || '',
      contactEmail: client.contactEmail || '',
      contactPhone: client.contactPhone || '',
    });
    setEditingClient(client);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
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
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Client</h1>
          <p className="text-muted-foreground">Tạo và quản lý tài khoản client portal</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm Client
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, email hoặc mã..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Công ty</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead>Mã truy cập</TableHead>
                <TableHead>Dự án</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.clients && data.clients.length > 0 ? (
                data.clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="font-medium">{client.companyName}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(client.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.contactName && <div>{client.contactName}</div>}
                      {client.contactEmail && (
                        <div className="text-sm text-muted-foreground">{client.contactEmail}</div>
                      )}
                      {client.contactPhone && (
                        <div className="text-sm text-muted-foreground">{client.contactPhone}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                          {client.accessCode}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => copyAccessCode(client.accessCode)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{client.projectCount}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={client.isActive ? 'default' : 'secondary'}
                        className={client.isActive ? 'bg-green-100 text-green-800' : ''}
                      >
                        {client.isActive ? 'Hoạt động' : 'Vô hiệu'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(client)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRegenerateCode(client.id)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Đổi mã truy cập
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(client)}>
                            {client.isActive ? (
                              <>
                                <X className="h-4 w-4 mr-2" />
                                Vô hiệu hóa
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Kích hoạt
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeletingClient(client)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto" />
                    <p className="mt-2 text-muted-foreground">
                      {searchQuery ? 'Không tìm thấy client' : 'Chưa có client nào'}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm Client mới</DialogTitle>
            <DialogDescription>
              Tạo tài khoản client portal. Mã truy cập sẽ được tạo tự động.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Tên công ty *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">Người liên hệ</Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Số điện thoại</Label>
              <Input
                id="contactPhone"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateSubmit} disabled={createMutation.isPending}>
              Tạo Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Client</DialogTitle>
            <DialogDescription>Cập nhật thông tin client</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-companyName">Tên công ty *</Label>
              <Input
                id="edit-companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contactName">Người liên hệ</Label>
              <Input
                id="edit-contactName"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contactEmail">Email</Label>
              <Input
                id="edit-contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contactPhone">Số điện thoại</Label>
              <Input
                id="edit-contactPhone"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingClient(null)}>
              Hủy
            </Button>
            <Button onClick={handleEditSubmit} disabled={updateMutation.isPending}>
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingClient} onOpenChange={(open) => !open && setDeletingClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa Client?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa client &quot;{deletingClient?.companyName}&quot;?
              Hành động này không thể hoàn tác.
              {deletingClient && deletingClient.projectCount > 0 && (
                <span className="block mt-2 text-destructive">
                  Client này có {deletingClient.projectCount} dự án. Vui lòng hủy liên kết trước.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

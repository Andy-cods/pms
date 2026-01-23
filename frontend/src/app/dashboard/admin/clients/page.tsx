'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
  FolderOpen,
  Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { toast } from 'sonner';
import {
  useClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  useRegenerateClientCode,
} from '@/hooks/use-admin';
import { AccessCodeDisplay } from '@/components/admin/access-code-display';
import { ClientFormModal } from '@/components/admin/client-form-modal';
import type { Client, CreateClientInput, UpdateClientInput } from '@/lib/api/admin';

type StatusFilter = 'all' | 'active' | 'inactive';

export default function AdminClientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const { data, isLoading } = useClients({
    search: searchQuery || undefined,
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
  });
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const deleteMutation = useDeleteClient();
  const regenerateMutation = useRegenerateClientCode();

  const handleCreate = async (formData: CreateClientInput) => {
    await createMutation.mutateAsync(formData);
  };

  const handleEdit = async (formData: CreateClientInput) => {
    if (!editingClient) return;
    await updateMutation.mutateAsync({
      id: editingClient.id,
      input: formData as UpdateClientInput,
    });
    setEditingClient(null);
  };

  const handleDelete = async () => {
    if (!deletingClient) return;
    try {
      await deleteMutation.mutateAsync(deletingClient.id);
      setDeletingClient(null);
    } catch {
      // Error toast is handled by the mutation
    }
  };

  const handleToggleActive = async (client: Client) => {
    await updateMutation.mutateAsync({
      id: client.id,
      input: { isActive: !client.isActive },
    });
  };

  const handleRegenerateCode = async (id: string) => {
    setRegeneratingId(id);
    try {
      await regenerateMutation.mutateAsync(id);
    } finally {
      setRegeneratingId(null);
    }
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

  const clients = data?.clients || [];
  const totalClients = data?.total || 0;
  const activeClients = clients.filter((c) => c.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quan ly Client</h1>
          <p className="text-muted-foreground">
            Tao va quan ly tai khoan client portal ({activeClients} hoat dong / {totalClients} tong)
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Them Client
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tim theo ten, email hoac ma..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as StatusFilter)}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Trang thai" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tat ca trang thai</SelectItem>
            <SelectItem value="active">Dang hoat dong</SelectItem>
            <SelectItem value="inactive">Vo hieu hoa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clients Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cong ty</TableHead>
                <TableHead>Lien he</TableHead>
                <TableHead>Ma truy cap</TableHead>
                <TableHead>Du an</TableHead>
                <TableHead>Trang thai</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length > 0 ? (
                clients.map((client) => (
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
                        <div className="text-sm text-muted-foreground">
                          {client.contactEmail}
                        </div>
                      )}
                      {client.contactPhone && (
                        <div className="text-sm text-muted-foreground">
                          {client.contactPhone}
                        </div>
                      )}
                      {!client.contactName && !client.contactEmail && !client.contactPhone && (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <AccessCodeDisplay
                        code={client.accessCode}
                        onRegenerate={() => handleRegenerateCode(client.id)}
                        isRegenerating={regeneratingId === client.id}
                        showRegenerateButton={false}
                      />
                    </TableCell>
                    <TableCell>
                      {client.projectCount > 0 ? (
                        <Link
                          href={`/dashboard/projects?clientId=${client.id}`}
                          className="inline-flex items-center gap-1.5 text-primary hover:underline"
                        >
                          <FolderOpen className="h-4 w-4" />
                          <span>{client.projectCount} du an</span>
                        </Link>
                      ) : (
                        <Badge variant="secondary">0 du an</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={client.isActive ? 'default' : 'secondary'}
                        className={
                          client.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-100'
                            : ''
                        }
                      >
                        {client.isActive ? 'Hoat dong' : 'Vo hieu'}
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
                          <DropdownMenuItem onClick={() => setEditingClient(client)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Chinh sua
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRegenerateCode(client.id)}
                            disabled={regeneratingId === client.id}
                          >
                            <svg
                              className={`h-4 w-4 mr-2 ${regeneratingId === client.id ? 'animate-spin' : ''}`}
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                            Doi ma truy cap
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(client)}>
                            {client.isActive ? (
                              <>
                                <X className="h-4 w-4 mr-2" />
                                Vo hieu hoa
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Kich hoat
                              </>
                            )}
                          </DropdownMenuItem>
                          {client.projectCount > 0 && (
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/projects?clientId=${client.id}`}>
                                <FolderOpen className="h-4 w-4 mr-2" />
                                Xem du an
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeletingClient(client)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Xoa
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
                      {searchQuery || statusFilter !== 'all'
                        ? 'Khong tim thay client nao'
                        : 'Chua co client nao'}
                    </p>
                    {!searchQuery && statusFilter === 'all' && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setShowCreateDialog(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Them client dau tien
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <ClientFormModal
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
      />

      {/* Edit Dialog */}
      <ClientFormModal
        open={!!editingClient}
        onOpenChange={(open) => !open && setEditingClient(null)}
        client={editingClient}
        onSubmit={handleEdit}
        isSubmitting={updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingClient}
        onOpenChange={(open) => !open && setDeletingClient(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoa Client?</AlertDialogTitle>
            <AlertDialogDescription>
              Ban co chac muon xoa client &quot;{deletingClient?.companyName}&quot;?
              Hanh dong nay khong the hoan tac.
              {deletingClient && deletingClient.projectCount > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Luu y: Client nay co {deletingClient.projectCount} du an. Khong the xoa
                  client dang co du an. Vui long huy lien ket cac du an truoc.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingClient ? deletingClient.projectCount > 0 : false}
            >
              Xoa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

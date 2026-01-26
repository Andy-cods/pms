'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  Search,
  Pencil,
  Trash2,
  FolderOpen,
  Mail,
  Phone,
  RefreshCw,
  X,
  Check,
  Power,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
  useClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  useRegenerateClientCode,
} from '@/hooks/use-admin';
import { AccessCodeDisplay } from '@/components/admin/access-code-display';
import { ClientFormModal } from '@/components/admin/client-form-modal';
import type { Client, CreateClientInput, UpdateClientInput } from '@/lib/api/admin';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | 'active' | 'inactive';

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Tat ca' },
  { value: 'active', label: 'Hoat dong' },
  { value: 'inactive', label: 'Vo hieu' },
];

export default function AdminClientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

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

  const getCompanyInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Search & Filter Skeleton */}
        <div className="flex gap-3">
          <Skeleton className="h-11 flex-1 max-w-md" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-9 w-20 rounded-full" />
            ))}
          </div>
        </div>

        {/* Card Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const clients = data?.clients || [];
  const totalClients = data?.total || 0;
  const activeClients = clients.filter((c) => c.isActive).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-1">
            {activeClients} hoat dong / {totalClients} tong so
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 transition-all shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Them Client
        </Button>
      </div>

      {/* Search & Filter Pills */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tim kiem client..."
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
        <div className="flex gap-2">
          {FILTER_OPTIONS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all',
                statusFilter === filter.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-surface hover:bg-muted text-foreground/80'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Client Cards Grid */}
      {clients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clients.map((client) => (
            <div
              key={client.id}
              className="group relative bg-card rounded-2xl border border-border/50 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-border"
              onMouseEnter={() => setHoveredCard(client.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Card Content */}
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start gap-4">
                  {/* Company Avatar */}
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {getCompanyInitials(client.companyName)}
                      </span>
                    </div>
                    {/* Status Indicator */}
                    <div
                      className={cn(
                        'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card',
                        client.isActive
                          ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                          : 'bg-gray-400'
                      )}
                    />
                  </div>

                  {/* Company Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{client.companyName}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(client.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>

                  {/* Projects Badge */}
                  {client.projectCount > 0 && (
                    <Link
                      href={`/dashboard/projects?clientId=${client.id}`}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/15 transition-colors"
                    >
                      <FolderOpen className="h-3 w-3" />
                      {client.projectCount}
                    </Link>
                  )}
                </div>

                {/* Contact Info */}
                <div className="mt-5 space-y-2.5">
                  {client.contactName && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <div className="w-7 h-7 rounded-lg bg-surface flex items-center justify-center">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="truncate">{client.contactName}</span>
                    </div>
                  )}
                  {client.contactEmail && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <div className="w-7 h-7 rounded-lg bg-surface flex items-center justify-center">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="truncate text-muted-foreground">{client.contactEmail}</span>
                    </div>
                  )}
                  {client.contactPhone && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <div className="w-7 h-7 rounded-lg bg-surface flex items-center justify-center">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="text-muted-foreground">{client.contactPhone}</span>
                    </div>
                  )}
                  {!client.contactName && !client.contactEmail && !client.contactPhone && (
                    <p className="text-sm text-muted-foreground italic">Chua co thong tin lien he</p>
                  )}
                </div>

                {/* Access Code */}
                <div className="mt-5 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Ma truy cap
                    </span>
                    <AccessCodeDisplay
                      code={client.accessCode}
                      onRegenerate={() => handleRegenerateCode(client.id)}
                      isRegenerating={regeneratingId === client.id}
                      showRegenerateButton={false}
                    />
                  </div>
                </div>
              </div>

              {/* Hover Overlay with Actions */}
              <div
                className={cn(
                  'absolute inset-0 bg-gradient-to-t from-background/95 via-background/80 to-background/60 backdrop-blur-sm flex items-end justify-center p-5 transition-all duration-300',
                  hoveredCard === client.id ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
              >
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingClient(client)}
                    className="flex-1 rounded-xl h-10 bg-card/80 backdrop-blur-sm"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Sua
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRegenerateCode(client.id)}
                    disabled={regeneratingId === client.id}
                    className="h-10 w-10 rounded-xl p-0 bg-card/80 backdrop-blur-sm"
                    title="Tao ma moi"
                  >
                    <RefreshCw
                      className={cn('h-4 w-4', regeneratingId === client.id && 'animate-spin')}
                    />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(client)}
                    className={cn(
                      'h-10 w-10 rounded-xl p-0 bg-card/80 backdrop-blur-sm',
                      client.isActive
                        ? 'hover:bg-amber-500/10 hover:border-amber-500/50 hover:text-amber-600'
                        : 'hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-600'
                    )}
                    title={client.isActive ? 'Vo hieu hoa' : 'Kich hoat'}
                  >
                    {client.isActive ? <Power className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingClient(client)}
                    disabled={client.projectCount > 0}
                    className={cn(
                      'h-10 w-10 rounded-xl p-0 bg-card/80 backdrop-blur-sm',
                      client.projectCount > 0
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-600'
                    )}
                    title={client.projectCount > 0 ? 'Khong the xoa (co du an)' : 'Xoa'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center mb-5">
            <Building2 className="h-9 w-9 text-muted-foreground" />
          </div>
          <p className="text-xl font-medium text-foreground">Khong tim thay client</p>
          <p className="text-sm text-muted-foreground mt-2 text-center max-w-md">
            {searchQuery || statusFilter !== 'all'
              ? 'Thu thay doi bo loc hoac tu khoa tim kiem'
              : 'Bat dau bang cach tao client dau tien cho he thong'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="mt-5 rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              Them client dau tien
            </Button>
          )}
        </div>
      )}

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
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Xoa Client?</AlertDialogTitle>
            <AlertDialogDescription>
              Ban co chac muon xoa client &quot;{deletingClient?.companyName}&quot;? Hanh dong nay khong the hoan tac.
              {deletingClient && deletingClient.projectCount > 0 && (
                <span className="block mt-3 p-3 rounded-xl bg-destructive/10 text-destructive font-medium">
                  Khong the xoa client dang co {deletingClient.projectCount} du an. Vui long huy lien ket cac du an truoc.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Huy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

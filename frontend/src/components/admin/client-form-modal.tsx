'use client';

import { useState, useMemo, useCallback } from 'react';
import { Loader2, Building2, User, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Client, CreateClientInput } from '@/lib/api/admin';
import { cn } from '@/lib/utils';

interface ClientFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSubmit: (data: CreateClientInput) => Promise<void>;
  isSubmitting?: boolean;
}

const EMPTY_FORM: CreateClientInput = {
  companyName: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
};

export function ClientFormModal({
  open,
  onOpenChange,
  client,
  onSubmit,
  isSubmitting = false,
}: ClientFormModalProps) {
  const isEditing = !!client;

  // Track local changes only
  const [localChanges, setLocalChanges] = useState<Partial<CreateClientInput>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Compute form data from client prop + local changes
  const formData: CreateClientInput = useMemo(() => {
    if (!open) return EMPTY_FORM;

    const baseData = client
      ? {
          companyName: client.companyName,
          contactName: client.contactName || '',
          contactEmail: client.contactEmail || '',
          contactPhone: client.contactPhone || '',
        }
      : EMPTY_FORM;

    return {
      companyName: localChanges.companyName ?? baseData.companyName,
      contactName: localChanges.contactName ?? baseData.contactName,
      contactEmail: localChanges.contactEmail ?? baseData.contactEmail,
      contactPhone: localChanges.contactPhone ?? baseData.contactPhone,
    };
  }, [open, client, localChanges]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Ten cong ty la bat buoc';
    }

    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Email khong hop le';
    }

    if (formData.contactPhone && !/^[0-9+\-\s()]{8,15}$/.test(formData.contactPhone)) {
      newErrors.contactPhone = 'So dien thoai khong hop le';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    try {
      await onSubmit(formData);
      setLocalChanges({});
      setErrors({});
      onOpenChange(false);
    } catch {
      // Error handling is done in the parent component via mutation
    }
  }, [validateForm, onSubmit, formData, onOpenChange]);

  const handleChange = useCallback((field: keyof CreateClientInput, value: string) => {
    setLocalChanges((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
  }, []);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      // Reset local state when closing
      setLocalChanges({});
      setErrors({});
    }
    onOpenChange(newOpen);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? 'Chinh sua Client' : 'Them Client moi'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Cap nhat thong tin client'
              : 'Tao tai khoan client portal. Ma truy cap se duoc tao tu dong.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-sm font-medium">
              Ten cong ty <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                placeholder="Nhap ten cong ty"
                className={cn(
                  'h-11 pl-11 rounded-xl bg-surface border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
                  errors.companyName && 'border-destructive focus:border-destructive focus:ring-destructive/20'
                )}
              />
            </div>
            {errors.companyName && (
              <p className="text-sm text-destructive">{errors.companyName}</p>
            )}
          </div>

          {/* Contact Name */}
          <div className="space-y-2">
            <Label htmlFor="contactName" className="text-sm font-medium">
              Nguoi lien he
            </Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => handleChange('contactName', e.target.value)}
                placeholder="Nhap ten nguoi lien he"
                className="h-11 pl-11 rounded-xl bg-surface border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Contact Email */}
          <div className="space-y-2">
            <Label htmlFor="contactEmail" className="text-sm font-medium">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleChange('contactEmail', e.target.value)}
                placeholder="example@company.com"
                className={cn(
                  'h-11 pl-11 rounded-xl bg-surface border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
                  errors.contactEmail && 'border-destructive focus:border-destructive focus:ring-destructive/20'
                )}
              />
            </div>
            {errors.contactEmail && (
              <p className="text-sm text-destructive">{errors.contactEmail}</p>
            )}
          </div>

          {/* Contact Phone */}
          <div className="space-y-2">
            <Label htmlFor="contactPhone" className="text-sm font-medium">
              So dien thoai
            </Label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="contactPhone"
                value={formData.contactPhone}
                onChange={(e) => handleChange('contactPhone', e.target.value)}
                placeholder="0901234567"
                className={cn(
                  'h-11 pl-11 rounded-xl bg-surface border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
                  errors.contactPhone && 'border-destructive focus:border-destructive focus:ring-destructive/20'
                )}
              />
            </div>
            {errors.contactPhone && (
              <p className="text-sm text-destructive">{errors.contactPhone}</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-3 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="flex-1 sm:flex-none rounded-xl h-11"
          >
            Huy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none rounded-xl h-11 min-w-[120px]"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Luu thay doi' : 'Tao Client'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

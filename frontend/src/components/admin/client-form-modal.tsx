'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
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

interface ClientFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSubmit: (data: CreateClientInput) => Promise<void>;
  isSubmitting?: boolean;
}

export function ClientFormModal({
  open,
  onOpenChange,
  client,
  onSubmit,
  isSubmitting = false,
}: ClientFormModalProps) {
  const isEditing = !!client;
  const [formData, setFormData] = useState<CreateClientInput>({
    companyName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (client) {
      setFormData({
        companyName: client.companyName,
        contactName: client.contactName || '',
        contactEmail: client.contactEmail || '',
        contactPhone: client.contactPhone || '',
      });
    } else {
      setFormData({
        companyName: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
      });
    }
    setErrors({});
  }, [client, open]);

  const validateForm = (): boolean => {
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
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await onSubmit(formData);
      onOpenChange(false);
    } catch {
      // Error handling is done in the parent component via mutation
    }
  };

  const handleChange = (field: keyof CreateClientInput, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Chinh sua Client' : 'Them Client moi'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Cap nhat thong tin client'
              : 'Tao tai khoan client portal. Ma truy cap se duoc tao tu dong.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">
              Ten cong ty <span className="text-destructive">*</span>
            </Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              placeholder="Nhap ten cong ty"
              className={errors.companyName ? 'border-destructive' : ''}
            />
            {errors.companyName && (
              <p className="text-sm text-destructive">{errors.companyName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactName">Nguoi lien he</Label>
            <Input
              id="contactName"
              value={formData.contactName}
              onChange={(e) => handleChange('contactName', e.target.value)}
              placeholder="Nhap ten nguoi lien he"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactEmail">Email</Label>
            <Input
              id="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              placeholder="example@company.com"
              className={errors.contactEmail ? 'border-destructive' : ''}
            />
            {errors.contactEmail && (
              <p className="text-sm text-destructive">{errors.contactEmail}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">So dien thoai</Label>
            <Input
              id="contactPhone"
              value={formData.contactPhone}
              onChange={(e) => handleChange('contactPhone', e.target.value)}
              placeholder="0901234567"
              className={errors.contactPhone ? 'border-destructive' : ''}
            />
            {errors.contactPhone && (
              <p className="text-sm text-destructive">{errors.contactPhone}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huy
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Luu' : 'Tao Client'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

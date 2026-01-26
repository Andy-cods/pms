'use client';

import { useState, useMemo, useCallback } from 'react';
import { Loader2, Eye, EyeOff, User, Mail, Lock, Shield } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AdminUser, CreateUserInput, UpdateUserInput, UserRole } from '@/lib/api/admin-users';
import { cn } from '@/lib/utils';

const USER_ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'SUPER_ADMIN', label: 'Super Admin', description: 'Quyen cao nhat' },
  { value: 'ADMIN', label: 'Admin', description: 'Quan tri he thong' },
  { value: 'TECHNICAL', label: 'Technical', description: 'Ky thuat' },
  { value: 'NVKD', label: 'NVKD', description: 'Nhan vien kinh doanh' },
  { value: 'PM', label: 'Project Manager', description: 'Quan ly du an' },
  { value: 'PLANNER', label: 'Planner', description: 'Lap ke hoach' },
  { value: 'ACCOUNT', label: 'Account', description: 'Ke toan' },
  { value: 'CONTENT', label: 'Content', description: 'Noi dung' },
  { value: 'DESIGN', label: 'Design', description: 'Thiet ke' },
  { value: 'MEDIA', label: 'Media', description: 'Truyen thong' },
];

interface UserFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: AdminUser | null;
  onSubmit: (data: CreateUserInput | UpdateUserInput) => Promise<void>;
  isSubmitting?: boolean;
  currentUserRole?: UserRole;
}

interface FormDataType {
  email: string;
  name: string;
  password: string;
  role: UserRole;
}

const EMPTY_FORM: FormDataType = {
  email: '',
  name: '',
  password: '',
  role: 'CONTENT',
};

export function UserFormModal({
  open,
  onOpenChange,
  user,
  onSubmit,
  isSubmitting = false,
  currentUserRole,
}: UserFormModalProps) {
  const isEditing = !!user;
  const [showPassword, setShowPassword] = useState(false);

  // Track local changes only
  const [localChanges, setLocalChanges] = useState<Partial<FormDataType>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Compute form data from user prop + local changes
  const formData: FormDataType = useMemo(() => {
    if (!open) return EMPTY_FORM;

    const baseData = user
      ? {
          email: user.email,
          name: user.name,
          password: '',
          role: user.role,
        }
      : EMPTY_FORM;

    return {
      email: localChanges.email ?? baseData.email,
      name: localChanges.name ?? baseData.name,
      password: localChanges.password ?? baseData.password,
      role: localChanges.role ?? baseData.role,
    };
  }, [open, user, localChanges]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Ten la bat buoc';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Ten phai co it nhat 2 ky tu';
    }

    if (!isEditing) {
      if (!formData.email.trim()) {
        newErrors.email = 'Email la bat buoc';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Email khong hop le';
      }

      if (!formData.password) {
        newErrors.password = 'Mat khau la bat buoc';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Mat khau phai co it nhat 8 ky tu';
      }
    }

    if (!formData.role) {
      newErrors.role = 'Vai tro la bat buoc';
    }

    // Check if non-super-admin tries to create/edit admin
    if (
      currentUserRole !== 'SUPER_ADMIN' &&
      (formData.role === 'ADMIN' || formData.role === 'SUPER_ADMIN')
    ) {
      newErrors.role = 'Chi Super Admin moi co the gan vai tro Admin';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, isEditing, currentUserRole]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    try {
      if (isEditing) {
        const updateData: UpdateUserInput = {
          name: formData.name,
          role: formData.role,
        };
        await onSubmit(updateData);
      } else {
        const createData: CreateUserInput = {
          email: formData.email.toLowerCase(),
          name: formData.name,
          password: formData.password,
          role: formData.role,
        };
        await onSubmit(createData);
      }
      setLocalChanges({});
      setErrors({});
      onOpenChange(false);
    } catch {
      // Error handling is done in the parent component via mutation
    }
  }, [validateForm, isEditing, formData, onSubmit, onOpenChange]);

  const handleChange = useCallback((field: string, value: string) => {
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
      setShowPassword(false);
    }
    onOpenChange(newOpen);
  }, [onOpenChange]);

  // Filter roles based on current user role
  const availableRoles = USER_ROLES.filter((role) => {
    if (currentUserRole === 'SUPER_ADMIN') return true;
    // Non-super-admins cannot assign SUPER_ADMIN or ADMIN roles
    return role.value !== 'SUPER_ADMIN' && role.value !== 'ADMIN';
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? 'Chinh sua nguoi dung' : 'Them nguoi dung moi'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Cap nhat thong tin nguoi dung'
              : 'Tao tai khoan nguoi dung moi trong he thong'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Ho va ten <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Nhap ho va ten"
                className={cn(
                  'h-11 pl-11 rounded-xl bg-surface border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
                  errors.name && 'border-destructive focus:border-destructive focus:ring-destructive/20'
                )}
              />
            </div>
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="example@company.com"
                className={cn(
                  'h-11 pl-11 rounded-xl bg-surface border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
                  errors.email && 'border-destructive focus:border-destructive focus:ring-destructive/20',
                  isEditing && 'opacity-60 cursor-not-allowed'
                )}
                disabled={isEditing}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
            {isEditing && (
              <p className="text-xs text-muted-foreground">
                Email khong the thay doi sau khi tao
              </p>
            )}
          </div>

          {/* Password - Only for new users */}
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Mat khau <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Nhap mat khau (it nhat 8 ky tu)"
                  className={cn(
                    'h-11 pl-11 pr-11 rounded-xl bg-surface border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
                    errors.password && 'border-destructive focus:border-destructive focus:ring-destructive/20'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>
          )}

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role" className="text-sm font-medium">
              Vai tro <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Select
                value={formData.role}
                onValueChange={(value) => handleChange('role', value)}
              >
                <SelectTrigger
                  className={cn(
                    'h-11 pl-11 rounded-xl bg-surface border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
                    errors.role && 'border-destructive focus:border-destructive focus:ring-destructive/20'
                  )}
                >
                  <SelectValue placeholder="Chon vai tro" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {availableRoles.map((role) => (
                    <SelectItem
                      key={role.value}
                      value={role.value}
                      className="rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{role.label}</span>
                        <span className="text-xs text-muted-foreground">
                          - {role.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role}</p>
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
            className="flex-1 sm:flex-none rounded-xl h-11 min-w-[140px]"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Luu thay doi' : 'Tao nguoi dung'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

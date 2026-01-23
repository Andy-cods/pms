'use client';

import { useEffect, useState } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';
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

const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'TECHNICAL', label: 'Technical' },
  { value: 'NVKD', label: 'NVKD (Sales)' },
  { value: 'PM', label: 'Project Manager' },
  { value: 'PLANNER', label: 'Planner' },
  { value: 'ACCOUNT', label: 'Account' },
  { value: 'CONTENT', label: 'Content' },
  { value: 'DESIGN', label: 'Design' },
  { value: 'MEDIA', label: 'Media' },
];

interface UserFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: AdminUser | null;
  onSubmit: (data: CreateUserInput | UpdateUserInput) => Promise<void>;
  isSubmitting?: boolean;
  currentUserRole?: UserRole;
}

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
  const [formData, setFormData] = useState<{
    email: string;
    name: string;
    password: string;
    role: UserRole;
  }>({
    email: '',
    name: '',
    password: '',
    role: 'CONTENT',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        name: user.name,
        password: '',
        role: user.role,
      });
    } else {
      setFormData({
        email: '',
        name: '',
        password: '',
        role: 'CONTENT',
      });
    }
    setErrors({});
    setShowPassword(false);
  }, [user, open]);

  const validateForm = (): boolean => {
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
  };

  const handleSubmit = async () => {
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
      onOpenChange(false);
    } catch {
      // Error handling is done in the parent component via mutation
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Filter roles based on current user role
  const availableRoles = USER_ROLES.filter((role) => {
    if (currentUserRole === 'SUPER_ADMIN') return true;
    // Non-super-admins cannot assign SUPER_ADMIN or ADMIN roles
    return role.value !== 'SUPER_ADMIN' && role.value !== 'ADMIN';
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Chinh sua nguoi dung' : 'Them nguoi dung moi'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Cap nhat thong tin nguoi dung'
              : 'Tao tai khoan nguoi dung moi trong he thong'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Ho va ten <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Nhap ho va ten"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="example@company.com"
              className={errors.email ? 'border-destructive' : ''}
              disabled={isEditing}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
            {isEditing && (
              <p className="text-xs text-muted-foreground">
                Email khong the thay doi sau khi tao
              </p>
            )}
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="password">
                Mat khau <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Nhap mat khau (it nhat 8 ky tu)"
                  className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">
              Vai tro <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleChange('role', value)}
            >
              <SelectTrigger className={errors.role ? 'border-destructive' : ''}>
                <SelectValue placeholder="Chon vai tro" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huy
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Luu' : 'Tao nguoi dung'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

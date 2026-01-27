'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { UserSearchCombobox } from '@/components/ui/user-search-combobox';
import { useAddTeamMember } from '@/hooks/use-projects';
import type { AdminUser, UserRole } from '@/lib/api/admin-users';
import { toast } from 'sonner';

const TEAM_ROLES: { value: UserRole; label: string }[] = [
  { value: 'PM', label: 'Project Manager' },
  { value: 'ACCOUNT', label: 'Account' },
  { value: 'CONTENT', label: 'Content' },
  { value: 'DESIGN', label: 'Design' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'PLANNER', label: 'Planner' },
  { value: 'TECHNICAL', label: 'Technical' },
  { value: 'NVKD', label: 'Sales' },
  { value: 'ADMIN', label: 'Admin' },
];

interface TeamMemberModalProps {
  projectId: string;
  existingMemberIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamMemberModal({
  projectId,
  existingMemberIds,
  open,
  onOpenChange,
}: TeamMemberModalProps) {
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [role, setRole] = useState<UserRole>('CONTENT');
  const [isPrimary, setIsPrimary] = useState(false);

  const addMember = useAddTeamMember();

  const handleSubmit = async () => {
    if (!selectedUser) {
      toast.error('Vui lòng chọn người dùng');
      return;
    }

    try {
      await addMember.mutateAsync({
        projectId,
        input: {
          userId: selectedUser.id,
          role,
          isPrimary,
        },
      });
      toast.success(`Đã thêm ${selectedUser.name} vào team`);
      handleClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err?.response?.data?.message || 'Không thể thêm thành viên';
      toast.error(message);
    }
  };

  const handleClose = () => {
    setSelectedUser(null);
    setRole('CONTENT');
    setIsPrimary(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[440px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Thêm thành viên</DialogTitle>
          <DialogDescription>
            Tìm và thêm thành viên vào team dự án.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* User Search */}
          <div className="space-y-2">
            <Label>Người dùng</Label>
            <UserSearchCombobox
              value={selectedUser?.id}
              onSelect={(user) => {
                setSelectedUser(user);
                // Auto-set role to match user's role
                setRole(user.role);
              }}
              excludeUserIds={existingMemberIds}
              placeholder="Tìm kiếm người dùng..."
            />
          </div>

          {/* Role Select */}
          <div className="space-y-2">
            <Label>Vai trò trong dự án</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {TEAM_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value} className="rounded-lg">
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Primary Contact */}
          <div className="flex items-center gap-3">
            <Checkbox
              id="isPrimary"
              checked={isPrimary}
              onCheckedChange={(checked) => setIsPrimary(checked === true)}
            />
            <Label htmlFor="isPrimary" className="text-sm cursor-pointer">
              Đặt làm người phụ trách chính
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            className="rounded-full"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedUser || addMember.isPending}
            className="rounded-full"
          >
            {addMember.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Thêm thành viên
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
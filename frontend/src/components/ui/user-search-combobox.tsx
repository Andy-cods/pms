'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdminUsers } from '@/hooks/use-admin-users';
import { useDebounce } from '@/hooks/use-debounce';
import type { AdminUser, UserRole } from '@/lib/api/admin-users';

// Role labels for display
const RoleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  TECHNICAL: 'Technical',
  NVKD: 'Sales',
  PM: 'PM',
  PLANNER: 'Planner',
  ACCOUNT: 'Account',
  CONTENT: 'Content',
  DESIGN: 'Design',
  MEDIA: 'Media',
};

interface UserSearchComboboxProps {
  value?: string;
  onSelect: (user: AdminUser) => void;
  excludeUserIds?: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function UserSearchCombobox({
  value,
  onSelect,
  excludeUserIds = [],
  placeholder = 'Tìm kiếm người dùng...',
  disabled = false,
  className,
}: UserSearchComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data, isLoading } = useAdminUsers({
    search: debouncedSearch || undefined,
    isActive: true,
    limit: 20,
  });

  // Filter out excluded users
  const filteredUsers = React.useMemo(() => {
    if (!data?.users) return [];
    return data.users.filter((user) => !excludeUserIds.includes(user.id));
  }, [data?.users, excludeUserIds]);

  // Get selected user for display
  const selectedUser = React.useMemo(() => {
    if (!value || !data?.users) return null;
    return data.users.find((user) => user.id === value);
  }, [value, data?.users]);

  const handleSelect = (user: AdminUser) => {
    onSelect(user);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !selectedUser && 'text-muted-foreground',
            className
          )}
        >
          {selectedUser ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={selectedUser.avatar || undefined} />
                <AvatarFallback className="text-[10px]">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{selectedUser.name}</span>
            </div>
          ) : (
            <span>{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder="Nhập tên hoặc email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <ScrollArea className="h-[240px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <User className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? 'Không tìm thấy người dùng'
                  : 'Nhập để tìm kiếm'}
              </p>
            </div>
          ) : (
            <div className="p-1">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelect(user)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm',
                    'hover:bg-accent hover:text-accent-foreground',
                    'focus:bg-accent focus:text-accent-foreground focus:outline-none',
                    value === user.id && 'bg-accent'
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar || undefined} />
                    <AvatarFallback>
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {RoleLabels[user.role]}
                  </Badge>
                  {value === user.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
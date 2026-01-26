'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { useRouter, usePathname } from 'next/navigation';
import {
  Menu,
  Moon,
  Sun,
  LogOut,
  User,
  Settings,
  Search,
  ChevronRight,
  Command,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { UserRoleLabels } from '@/types';
import { NotificationBell } from '@/components/notification';
import { cn } from '@/lib/utils';

interface NavbarProps {
  onMenuClick?: () => void;
}

// Breadcrumb path mapping
const pathLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  projects: 'Du an',
  tasks: 'Tasks',
  files: 'Files',
  approvals: 'Phe duyet',
  calendar: 'Lich',
  notifications: 'Thong bao',
  reports: 'Bao cao',
  admin: 'Quan tri',
  users: 'Users',
  clients: 'Clients',
  'audit-logs': 'Nhat ky',
  settings: 'Cai dat',
  profile: 'Ho so',
};

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: { label: string; href: string }[] = [];

    segments.forEach((segment, index) => {
      // Skip dynamic segments (those with [])
      if (segment.startsWith('[')) return;

      const href = '/' + segments.slice(0, index + 1).join('/');
      const label = pathLabels[segment] || segment;
      breadcrumbs.push({ label, href });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-14 items-center justify-between px-4 lg:px-6',
        // Glassmorphism effect
        'bg-navbar backdrop-blur-[20px] backdrop-saturate-[180%]',
        // Subtle bottom border
        'border-b border-navbar-border'
      )}
    >
      {/* Left side - Mobile menu + Breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9 rounded-lg hover:bg-accent/80"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        {/* Breadcrumb navigation - hidden on mobile */}
        <nav className="hidden lg:flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              )}
              <button
                onClick={() => router.push(crumb.href)}
                className={cn(
                  'px-1.5 py-0.5 rounded-md transition-colors',
                  index === breadcrumbs.length - 1
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                {crumb.label}
              </button>
            </div>
          ))}
        </nav>

        {/* Mobile title */}
        <h1 className="text-sm font-medium lg:hidden">
          {breadcrumbs[breadcrumbs.length - 1]?.label || 'Dashboard'}
        </h1>
      </div>

      {/* Center - Search bar (hidden on mobile) */}
      <div className="hidden md:flex flex-1 justify-center max-w-md mx-8">
        <div
          className={cn(
            'relative w-full transition-all duration-200',
            isSearchFocused && 'scale-[1.02]'
          )}
        >
          <div
            className={cn(
              'flex items-center gap-2 px-3.5 h-9 rounded-full transition-all duration-200',
              'bg-accent/60 hover:bg-accent/80',
              isSearchFocused && 'bg-accent ring-2 ring-primary/20'
            )}
          >
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Tim kiem..."
              className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/70 focus:outline-none"
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
            <kbd className="hidden lg:inline-flex h-5 items-center gap-0.5 rounded border border-border/50 bg-background/50 px-1.5 text-[10px] font-medium text-muted-foreground">
              <Command className="h-3 w-3" />K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-1">
        {/* Mobile search button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9 rounded-lg hover:bg-accent/80"
        >
          <Search className="h-[18px] w-[18px]" />
          <span className="sr-only">Tim kiem</span>
        </Button>

        {/* Notifications */}
        <NotificationBell />

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg hover:bg-accent/80"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full ml-1 hover:ring-2 hover:ring-primary/20 transition-all"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar || undefined} alt={user?.name} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                  {user?.name ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 rounded-xl p-1.5"
            sideOffset={8}
          >
            <DropdownMenuLabel className="font-normal px-2 py-2">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                {user?.role && (
                  <Badge
                    variant="secondary"
                    className="mt-1.5 w-fit text-[10px] px-2 py-0.5 rounded-md"
                  >
                    {UserRoleLabels[user.role]}
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              onClick={() => router.push('/dashboard/profile')}
              className="rounded-lg px-2 py-2 cursor-pointer"
            >
              <User className="mr-2.5 h-4 w-4" />
              <span className="text-sm">Ho so ca nhan</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push('/dashboard/admin/settings')}
              className="rounded-lg px-2 py-2 cursor-pointer"
            >
              <Settings className="mr-2.5 h-4 w-4" />
              <span className="text-sm">Cai dat</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              onClick={logout}
              className="rounded-lg px-2 py-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <LogOut className="mr-2.5 h-4 w-4" />
              <span className="text-sm">Dang xuat</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

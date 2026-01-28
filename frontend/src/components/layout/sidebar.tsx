'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Files,
  Calendar,
  Bell,
  Settings,
  Users,
  ClipboardCheck,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  History,
  Building2,
  LogOut,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserRole } from '@/types';
import { useAuth } from '@/hooks/use-auth';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  {
    title: 'Tổng quan',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Sales Pipeline',
    href: '/dashboard/sales-pipeline',
    icon: TrendingUp,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.NVKD, UserRole.PM],
  },
  {
    title: 'Dự án',
    href: '/dashboard/projects',
    icon: FolderKanban,
  },
  {
    title: 'Nhiệm vụ',
    href: '/dashboard/tasks',
    icon: CheckSquare,
  },
  {
    title: 'Tài liệu',
    href: '/dashboard/files',
    icon: Files,
  },
  {
    title: 'Phê duyệt',
    href: '/dashboard/approvals',
    icon: ClipboardCheck,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.NVKD, UserRole.PM],
  },
  {
    title: 'Lịch',
    href: '/dashboard/calendar',
    icon: Calendar,
  },
  {
    title: 'Thông báo',
    href: '/dashboard/notifications',
    icon: Bell,
  },
  {
    title: 'Báo cáo',
    href: '/dashboard/reports',
    icon: BarChart3,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.NVKD, UserRole.PM],
  },
];

const adminNavItems: NavItem[] = [
  {
    title: 'Quản lý người dùng',
    href: '/dashboard/admin/users',
    icon: Users,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
  {
    title: 'Quản lý khách hàng',
    href: '/dashboard/admin/clients',
    icon: Building2,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
  {
    title: 'Nhật ký',
    href: '/dashboard/admin/audit-logs',
    icon: History,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
  {
    title: 'Cài đặt',
    href: '/dashboard/admin/settings',
    icon: Settings,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
];

interface SidebarProps {
  userRole?: UserRole;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ userRole, isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const filterNavItems = (items: NavItem[]) => {
    if (!userRole) return items;
    return items.filter((item) => !item.roles || item.roles.includes(userRole));
  };

  const filteredNavItems = filterNavItems(navItems);
  const filteredAdminItems = filterNavItems(adminNavItems);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href ||
      (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
    const Icon = item.icon;

    const linkContent = (
      <Link
        href={item.href}
        className={cn(
          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200',
          isActive
            ? 'bg-sidebar-accent text-sidebar-foreground'
            : 'text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
          isCollapsed && 'justify-center px-2.5'
        )}
      >
        <Icon
          className={cn(
            'h-[18px] w-[18px] shrink-0 transition-transform duration-200',
            !isActive && 'group-hover:scale-105'
          )}
        />
        {!isCollapsed && (
          <span className="truncate">{item.title}</span>
        )}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent
            side="right"
            className="font-medium text-xs px-3 py-1.5 rounded-lg"
            sideOffset={8}
          >
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'flex h-full flex-col transition-all duration-300 ease-out',
          // Glassmorphism effect
          'bg-sidebar backdrop-blur-[20px] backdrop-saturate-[180%]',
          // Subtle border on right side only
          'border-r border-sidebar-border',
          isCollapsed ? 'w-[68px]' : 'w-60'
        )}
      >
        {/* Logo Section */}
        <div
          className={cn(
            'flex h-14 items-center shrink-0',
            isCollapsed ? 'justify-center px-3' : 'px-5'
          )}
        >
          {isCollapsed ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-sm font-semibold text-primary">BC</span>
            </div>
          ) : (
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <span className="text-sm font-semibold text-primary">BC</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-sidebar-foreground leading-tight">
                  BC Agency
                </span>
                <span className="text-[10px] text-sidebar-muted leading-tight">
                  Quản lý dự án
                </span>
              </div>
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {/* Main Navigation */}
          <div className="space-y-0.5">
            {filteredNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>

          {/* Admin Section */}
          {filteredAdminItems.length > 0 && (
            <div className="mt-6">
              {!isCollapsed && (
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted/70">
                  Quản trị
                </p>
              )}
              {isCollapsed && <div className="my-3 mx-2 border-t border-sidebar-border" />}
              <div className="space-y-0.5">
                {filteredAdminItems.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* User Profile Section */}
        {user && (
          <div
            className={cn(
              'shrink-0 border-t border-sidebar-border',
              isCollapsed ? 'p-2' : 'p-3'
            )}
          >
            {isCollapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    className="flex w-full items-center justify-center rounded-xl p-2 transition-colors hover:bg-sidebar-accent"
                    onClick={() => {}}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar || undefined} alt={user.name} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="font-medium text-xs px-3 py-1.5 rounded-lg"
                  sideOffset={8}
                >
                  {user.name}
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-sidebar-accent/50">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={user.avatar || undefined} alt={user.name} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-sidebar-foreground truncate">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-sidebar-muted truncate">
                    {user.email}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Collapse Toggle */}
        <div className={cn('shrink-0 border-t border-sidebar-border', isCollapsed ? 'p-2' : 'p-3')}>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'w-full rounded-xl text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200',
              isCollapsed ? 'px-2 justify-center' : 'justify-start px-3'
            )}
            onClick={onToggle}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="ml-2 text-[13px]">Thu gọn</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}

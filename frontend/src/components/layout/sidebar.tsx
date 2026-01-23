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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserRole } from '@/types';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Dự án',
    href: '/dashboard/projects',
    icon: FolderKanban,
  },
  {
    title: 'Tasks',
    href: '/dashboard/tasks',
    icon: CheckSquare,
  },
  {
    title: 'Files',
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
    title: 'Quan ly Users',
    href: '/dashboard/admin/users',
    icon: Users,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
  {
    title: 'Quan ly Clients',
    href: '/dashboard/admin/clients',
    icon: Building2,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
  {
    title: 'Nhat ky hoat dong',
    href: '/dashboard/admin/audit-logs',
    icon: History,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
  {
    title: 'Cai dat',
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

  const filterNavItems = (items: NavItem[]) => {
    if (!userRole) return items;
    return items.filter((item) => !item.roles || item.roles.includes(userRole));
  };

  const filteredNavItems = filterNavItems(navItems);
  const filteredAdminItems = filterNavItems(adminNavItems);

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    const Icon = item.icon;

    const linkContent = (
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          isCollapsed && 'justify-center px-2'
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {!isCollapsed && <span>{item.title}</span>}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
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
          'flex h-full flex-col border-r bg-card transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className={cn('flex h-16 items-center border-b px-4', isCollapsed && 'justify-center px-2')}>
          {isCollapsed ? (
            <span className="text-xl font-bold text-primary">BC</span>
          ) : (
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary">BC Agency</span>
              <span className="text-sm text-muted-foreground">PMS</span>
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {filteredNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>

          {filteredAdminItems.length > 0 && (
            <>
              <div className="my-4 border-t" />
              <div className="space-y-1">
                {!isCollapsed && (
                  <p className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
                    Quản trị
                  </p>
                )}
                {filteredAdminItems.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </div>
            </>
          )}
        </nav>

        {/* Collapse Toggle */}
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn('w-full', isCollapsed && 'px-2')}
            onClick={onToggle}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="ml-2">Thu gọn</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  LayoutDashboard,
  FolderKanban,
  LogOut,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useClientStore } from '@/store/client.store';
import { useRouter } from 'next/navigation';

const navItems = [
  {
    title: 'Tong quan',
    href: '/client/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Du an',
    href: '/client/projects',
    icon: FolderKanban,
  },
];

/**
 * Client Sidebar Component
 *
 * A clean, minimal sidebar for the client portal.
 * This component is kept for potential mobile drawer usage.
 *
 * Design: Apple-inspired with teal accent color (#30d158)
 */
export function ClientSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { client, logout } = useClientStore();

  const handleLogout = () => {
    logout();
    router.push('/client-login');
  };

  return (
    <div className="flex h-full flex-col bg-background/95 backdrop-blur-md border-r border-border">
      {/* Logo Section */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <Building2 className="h-7 w-7 text-[var(--client-primary)]" />
        <div className="flex flex-col">
          <span className="font-semibold text-sm">BC Agency</span>
          <span className="text-[10px] text-muted-foreground">Client Portal</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-[var(--client-primary-light)] text-[var(--client-primary)]'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 transition-colors',
                  isActive ? 'text-[var(--client-primary)]' : ''
                )}
              />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        {/* Company Info */}
        <div className="mb-4 px-2">
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-[var(--client-secure)]" />
            <span className="font-medium truncate">{client?.companyName}</span>
          </div>
          {client?.contactName && (
            <div className="text-xs text-muted-foreground truncate mt-1 pl-6">
              {client.contactName}
            </div>
          )}
        </div>

        {/* Logout Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl h-11"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Dang xuat
        </Button>
      </div>
    </div>
  );
}

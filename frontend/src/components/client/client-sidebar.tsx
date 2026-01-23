'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, LayoutDashboard, FolderKanban, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useClientStore } from '@/store/client.store';
import { useRouter } from 'next/navigation';

const navItems = [
  {
    title: 'Tổng quan',
    href: '/client/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Dự án',
    href: '/client/projects',
    icon: FolderKanban,
  },
];

export function ClientSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { client, logout } = useClientStore();

  const handleLogout = () => {
    logout();
    router.push('/client-login');
  };

  return (
    <div className="flex h-full flex-col border-r bg-background">
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4">
        <Building2 className="h-6 w-6 text-primary" />
        <span className="ml-2 font-semibold">Client Portal</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="mb-3 text-sm">
          <div className="font-medium truncate">{client?.companyName}</div>
          {client?.contactName && (
            <div className="text-muted-foreground truncate">{client.contactName}</div>
          )}
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Đăng xuất
        </Button>
      </div>
    </div>
  );
}

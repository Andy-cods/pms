'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  LayoutDashboard,
  FolderKanban,
  LogOut,
  Shield,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useClientStore } from '@/store/client.store';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import '@/styles/client-portal.css';
import { useState } from 'react';

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

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { client, isAuthenticated, isLoading, setClient, setLoading, logout } =
    useClientStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const clientId = localStorage.getItem('clientId');
    const clientName = localStorage.getItem('clientName');

    if (!accessToken || !clientId) {
      setLoading(false);
      router.push('/client-login');
      return;
    }

    if (!client && clientId && clientName) {
      setClient({
        id: clientId,
        companyName: clientName,
        contactName: null,
      });
    } else {
      setLoading(false);
    }
  }, [client, router, setClient, setLoading]);

  const handleLogout = () => {
    logout();
    router.push('/client-login');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        {/* Header Skeleton */}
        <header className="client-header">
          <Skeleton className="h-8 w-32" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </header>

        {/* Content Skeleton */}
        <main className="flex-1">
          <div className="client-container">
            <Skeleton className="h-10 w-64 mb-4" />
            <Skeleton className="h-6 w-96 mb-8" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-96 mt-8 rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header - Clean, minimal navigation */}
      <header className="client-header">
        {/* Logo */}
        <Link href="/client/dashboard" className="client-logo">
          <Building2 className="client-logo-icon" />
          <span className="hidden sm:inline">BC Agency</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex client-nav">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn('client-nav-link', isActive && 'active')}
              >
                <item.icon className="client-nav-icon" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Company name - Hidden on mobile */}
          <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-[var(--client-secure)]" />
            <span className="truncate max-w-[160px]">{client?.companyName}</span>
          </div>

          <ThemeToggle />

          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="hidden sm:inline-flex text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Thoat</span>
          </Button>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b bg-background/95 backdrop-blur-md">
          <nav className="client-container py-4 space-y-2">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors',
                    isActive
                      ? 'bg-[var(--client-primary-light)] text-[var(--client-primary)]'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </Link>
              );
            })}

            {/* Mobile company info and logout */}
            <div className="pt-4 mt-4 border-t">
              <div className="px-4 mb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-[var(--client-secure)]" />
                  <span>{client?.companyName}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Dang xuat
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <div className="client-container">{children}</div>
      </main>

      {/* Subtle Watermark */}
      <div className="client-watermark">
        <Shield className="h-3.5 w-3.5" />
        <span>Powered by BC Agency</span>
      </div>
    </div>
  );
}

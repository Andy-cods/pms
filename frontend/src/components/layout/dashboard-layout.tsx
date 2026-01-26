'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Sidebar } from './sidebar';
import { Navbar } from './navbar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Loading state with Apple-style skeleton
  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        {/* Sidebar skeleton */}
        <div className="hidden w-60 flex-col lg:flex bg-sidebar/50 backdrop-blur-sm border-r border-sidebar-border">
          <div className="flex h-14 items-center px-5">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="ml-2.5 space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-2.5 w-24" />
            </div>
          </div>
          <div className="flex-1 space-y-1 px-3 py-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-xl" />
            ))}
          </div>
          <div className="border-t border-sidebar-border p-3">
            <div className="flex items-center gap-3 p-2">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </div>
        </div>
        {/* Main content skeleton */}
        <div className="flex flex-1 flex-col">
          <div className="flex h-14 items-center justify-between border-b border-navbar-border bg-navbar/50 backdrop-blur-sm px-6">
            <Skeleton className="h-5 w-32 rounded-md" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
          <div className="flex-1 space-y-6 p-6 lg:p-8">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-80 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated - will redirect
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          userRole={user.role}
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent
          side="left"
          className="w-60 p-0 border-r-0 bg-sidebar backdrop-blur-[20px] backdrop-saturate-[180%]"
        >
          <Sidebar userRole={user.role} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuClick={() => setIsMobileSidebarOpen(true)} />

        {/* Content Area with generous padding and max-width */}
        <main
          className={cn(
            'flex-1 overflow-y-auto',
            // Generous padding (24px mobile, 32px desktop)
            'p-6 lg:p-8',
            // Smooth transition for sidebar collapse
            'transition-all duration-300 ease-out'
          )}
        >
          {/* Max-width container for readability */}
          <div className="mx-auto w-full max-w-7xl">
            {/* Page content with subtle entrance animation */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Toast notifications with Apple-style positioning */}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          classNames: {
            toast: 'rounded-xl shadow-lg backdrop-blur-sm',
          },
        }}
      />
    </div>
  );
}

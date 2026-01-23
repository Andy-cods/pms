'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClientSidebar } from '@/components/client/client-sidebar';
import { useClientStore } from '@/store/client.store';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { client, isAuthenticated, isLoading, setClient, setLoading } = useClientStore();

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

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <div className="w-64 border-r">
          <Skeleton className="h-full" />
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden w-64 md:block">
        <ClientSidebar />
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b px-6">
          <div className="flex items-center gap-4 md:hidden" />
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <span className="text-sm text-muted-foreground">
              {client?.companyName}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

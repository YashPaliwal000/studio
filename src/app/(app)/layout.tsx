
'use client'; // Required for using hooks like useAuth

import type { ReactNode } from 'react';
import AppLayoutClient from '@/components/layout/AppLayoutClient'; // Renamed for clarity
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

export default function ProtectedAppLayout({ children }: { children: ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Middleware handles primary redirection.
    // This is a client-side fallback or reinforcement.
    if (!isLoading && !isLoggedIn) {
      router.replace('/login');
    }
  }, [isLoggedIn, isLoading, router]);

  if (isLoading) {
    // Consistent loading screen for the protected area
    return (
      <div className="flex min-h-screen w-full flex-col bg-background">
        {/* Skeleton Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-card p-4 sm:flex space-y-2">
          <Skeleton className="h-12 w-full rounded-lg mb-4" />
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-md" />)}
        </aside>
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-60">
          {/* Skeleton Header */}
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <Skeleton className="h-8 w-8 sm:hidden" /> {/* Mobile menu trigger */}
            <Skeleton className="h-8 w-32" /> {/* App Name */}
            <div className="ml-auto">
              <Skeleton className="h-8 w-24" /> {/* Logout button */}
            </div>
          </header>
          {/* Skeleton Main Content Area */}
          <main className="flex-grow p-4 sm:px-6 sm:py-0 md:gap-8">
            <Skeleton className="h-64 w-full" />
          </main>
        </div>
      </div>
    );
  }

  // If not loading and not logged in, router.replace should have already run.
  // Rendering null here prevents a flash of content if redirection is slightly delayed.
  if (!isLoggedIn) {
    return null;
  }

  // User is logged in, render the actual app layout and children
  return <AppLayoutClient>{children}</AppLayoutClient>;
}

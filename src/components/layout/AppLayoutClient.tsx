
'use client';

import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

// This is the actual layout structure for authenticated users.
// It's a client component because its parent (ProtectedAppLayout) is a client component.
interface AppLayoutClientProps {
  children: ReactNode;
}

export default function AppLayoutClient({ children }: AppLayoutClientProps) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Sidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-60">
        <Header />
        <main className="flex-grow p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
}

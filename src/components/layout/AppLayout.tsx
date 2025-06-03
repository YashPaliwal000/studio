
'use client'; // This component is now client-side due to useAuth in its parent (ProtectedAppLayout)

import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '@/contexts/AuthContext'; // Required for conditional rendering inside

interface AppLayoutClientProps { // Renamed to AppLayoutClient
  children: ReactNode;
}

// Renamed to AppLayoutClient as it's used within ProtectedAppLayout which is 'use client'
export default function AppLayoutClient({ children }: AppLayoutClientProps) {
  const { isLoggedIn, isLoading } = useAuth();

  // We might not need this check if ProtectedAppLayout handles it,
  // but it's an extra layer of safety.
  if (isLoading || !isLoggedIn) {
    // Or return a specific loader for the app layout itself
    // This should ideally not be hit if ProtectedAppLayout works correctly.
    return null; 
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Sidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-60"> {/* Adjusted pl for sidebar width */}
        <Header />
        <main className="flex-grow p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
}

// Create a new file for the server component if needed, or ensure this client component is used appropriately.
// For now, renaming to AppLayoutClient and making it 'use client'
// is the simplest way to integrate with the new auth flow.
// The original src/app/(app)/layout.tsx now handles auth checks and uses this.

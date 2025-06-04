
'use client';

import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoginPage() {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.replace('/'); // Redirect to dashboard
    }
  }, [isLoggedIn, isLoading, router]);

  // If initial auth status is still loading OR if user is logged in (either from cookie or after successful form submission)
  // then show a loading/redirecting indicator.
  if (isLoading || isLoggedIn) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-primary/30 p-4 text-center">
        <div className="p-8 bg-card rounded-lg shadow-xl">
          <svg
            className="animate-spin h-10 w-10 text-primary mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {isLoading && !isLoggedIn ? ( // Only show "Checking session" if truly initial loading and not yet logged in
            <p className="text-xl font-semibold text-foreground">Checking session...</p>
          ) : (
            <>
              <p className="text-xl font-semibold text-foreground">Login Successful!</p>
              <p className="text-muted-foreground">Redirecting to dashboard...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // If not loading and not logged in, show the login form.
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-primary/20 p-4">
      <LoginForm />
    </div>
  );
}

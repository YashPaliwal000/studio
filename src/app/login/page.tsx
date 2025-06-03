
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
      router.replace('/'); // Redirect to dashboard if already logged in
    }
  }, [isLoggedIn, isLoading, router]);

  if (isLoading || (!isLoading && isLoggedIn)) {
    // Show a loading state or nothing while checking auth/redirecting
    return (
       <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-primary/30 p-4">
        <Skeleton className="h-[450px] w-full max-w-md rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-primary/20 p-4">
      <LoginForm />
    </div>
  );
}

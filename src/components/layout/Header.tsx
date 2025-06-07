
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Home } from "lucide-react";
import Link from "next/link";
import NavLinks from "./NavLinks";
import LogoutButton from "@/components/auth/LogoutButton";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from 'react';
import { Skeleton } from "@/components/ui/skeleton";

export default function Header() {
  const { isLoggedIn, isLoading: authIsLoading } = useAuth();
  const [isClientMounted, setIsClientMounted] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  // This is the version of the header rendered on the server and during the initial client render pass.
  // It also serves as a fallback if auth is still loading after client mount.
  // It uses placeholders for elements that depend on isLoggedIn.
  if (!isClientMounted || authIsLoading) {
    return (
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        {/* Placeholder for mobile menu trigger */}
        <Skeleton className="h-10 w-10 sm:hidden" />
        
        <div className="flex items-center gap-2">
          <Home className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold font-headline">{APP_NAME}</h1>
        </div>
        <div className="ml-auto">
           {/* Placeholder for LogoutButton */}
           <Skeleton className="h-9 w-24" />
        </div>
      </header>
    );
  }

  // Client is mounted and auth state is resolved (not loading)
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      {isLoggedIn ? (
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="sm:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="sm:max-w-xs bg-card">
            <nav className="grid gap-6 text-lg font-medium p-4">
              <Link
                href="/"
                className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base mb-4"
              >
                <Home className="h-5 w-5 transition-all group-hover:scale-110" />
                <span className="sr-only">{APP_NAME}</span>
              </Link>
              <NavLinks isMobile={true} />
            </nav>
          </SheetContent>
        </Sheet>
      ) : (
        // If not logged in, render a placeholder for the sheet trigger to maintain layout consistency
        <div className="h-10 w-10 sm:hidden" />
      )}

      <div className="flex items-center gap-2">
        {isLoggedIn ? (
          <Link href="/" className="flex items-center gap-2">
            <Home className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold font-headline">{APP_NAME}</h1>
          </Link>
        ) : (
           <div className="flex items-center gap-2">
            <Home className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold font-headline">{APP_NAME}</h1>
          </div>
        )}
      </div>

      <div className="ml-auto">
        {isLoggedIn ? <LogoutButton /> : <div className="h-9 w-24" /> /* Placeholder for LogoutButton */}
      </div>
    </header>
  );
}

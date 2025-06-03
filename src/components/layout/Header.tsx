
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Home } from "lucide-react";
import Link from "next/link";
import NavLinks from "./NavLinks";
import LogoutButton from "@/components/auth/LogoutButton"; // Import LogoutButton
import { useAuth } from "@/contexts/AuthContext"; // To conditionally show elements

export default function Header() {
  const { isLoggedIn, isLoading } = useAuth(); // Use useAuth hook

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      {!isLoading && isLoggedIn && ( // Only show menu if logged in
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="sm:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="sm:max-w-xs bg-card"> {/* Added bg-card for better visibility */}
            <nav className="grid gap-6 text-lg font-medium p-4"> {/* Added padding */}
              <Link
                href="/"
                className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base mb-4" // Added margin bottom
              >
                <Home className="h-5 w-5 transition-all group-hover:scale-110" />
                <span className="sr-only">{APP_NAME}</span>
              </Link>
              <NavLinks isMobile={true} />
            </nav>
          </SheetContent>
        </Sheet>
      )}
      <div className="flex items-center gap-2">
        {/* Conditionally render Home icon link if logged in, or just title */}
        {!isLoading && isLoggedIn ? (
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
      <div className="ml-auto"> {/* Push logout button to the right */}
        {!isLoading && isLoggedIn && <LogoutButton />}
      </div>
    </header>
  );
}

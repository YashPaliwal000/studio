import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger }
from "@/components/ui/sheet";
import { Menu, Home } from "lucide-react";
import Link from "next/link";
import NavLinks from "./NavLinks";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <Home className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">{APP_NAME}</span>
            </Link>
            <NavLinks isMobile={true} />
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex items-center gap-2">
        <Home className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-semibold font-headline">{APP_NAME}</h1>
      </div>
      {/* Add User Avatar/menu here if needed */}
    </header>
  );
}

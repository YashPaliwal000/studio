import Link from 'next/link';
import { Home } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import NavLinks from './NavLinks';

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-card sm:flex">
      <nav className="flex flex-col gap-2 p-4">
        <Link
          href="/"
          className="group mb-4 flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary text-lg font-semibold text-primary-foreground md:text-base"
        >
          <Home className="h-6 w-6 transition-all group-hover:scale-110" />
          <span>{APP_NAME}</span>
        </Link>
        <NavLinks />
      </nav>
    </aside>
  );
}

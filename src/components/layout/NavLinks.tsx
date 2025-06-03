'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CalendarPlus,
  CalendarDays,
  CheckCheck,
  LineChart,
  ListOrdered,
} from 'lucide-react';

interface NavLinksProps {
  isMobile?: boolean;
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/bookings', label: 'Bookings', icon: ListOrdered },
  { href: '/bookings/add', label: 'Add Booking', icon: CalendarPlus },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/checkin', label: 'Daily Check-in', icon: CheckCheck },
  { href: '/revenue', label: 'Revenue', icon: LineChart },
];

export default function NavLinks({ isMobile = false }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
            {
              'text-primary bg-muted': pathname === item.href,
              'justify-start': !isMobile,
              'text-lg': isMobile,
              'gap-4': isMobile,
            }
          )}
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </Link>
      ))}
    </>
  );
}

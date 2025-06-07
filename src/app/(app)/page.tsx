
'use client';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BedDouble, CalendarCheck, UserPlus, TrendingUp } from 'lucide-react';
import { ROOM_CONFIG, APP_NAME } from '@/lib/constants';
import { useBookings } from '@/hooks/useBookings';
import { isToday, isWithinInterval, startOfDay } from 'date-fns';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { bookings, loading: bookingsLoading } = useBookings();

  const dashboardSummary = useMemo(() => {
    if (bookingsLoading || !bookings) {
      return {
        todayArrivals: 0,
        availableRoomsDisplay: `0 / ${ROOM_CONFIG.length}`,
        occupiedRoomsToday: 0,
        todaysRevenue: 0,
      };
    }

    const today_start = startOfDay(new Date());

    const todaysArrivalsCount = bookings.filter(
      (b) =>
        b.status === 'Confirmed' &&
        isToday(new Date(b.checkInDate))
    ).length;

    const occupiedRoomIdsToday = new Set<number>();
    bookings.forEach((booking) => {
      const checkIn = startOfDay(new Date(booking.checkInDate));
      const checkOut = startOfDay(new Date(booking.checkOutDate)); // checkOutDate is exclusive

      if (
        (booking.status === 'Confirmed' || booking.status === 'CheckedIn') &&
        checkIn <= today_start &&
        today_start < checkOut
      ) {
        booking.roomNumbers.forEach((rn) => occupiedRoomIdsToday.add(rn));
      }
    });
    const occupiedRoomsTodayCount = occupiedRoomIdsToday.size;
    const totalRooms = ROOM_CONFIG.length;
    const availableRooms = totalRooms - occupiedRoomsTodayCount;

    let revenueForToday = 0;
    bookings.forEach((booking) => {
       const checkIn = startOfDay(new Date(booking.checkInDate));
       const checkOut = startOfDay(new Date(booking.checkOutDate));

      if (
        (booking.status === 'Confirmed' || booking.status === 'CheckedIn') &&
        checkIn <= today_start &&
        today_start < checkOut
      ) {
        // Sum of per-night prices for rooms in this booking
        const dailyRateForThisBooking = booking.roomPrices.reduce(
          (sum, rp) => sum + rp.price,
          0
        );
        revenueForToday += dailyRateForThisBooking;
      }
    });

    return {
      todayArrivals: todaysArrivalsCount,
      availableRoomsDisplay: `${availableRooms} / ${totalRooms}`,
      occupiedRoomsToday: occupiedRoomsTodayCount, // For potential internal use
      todaysRevenue: revenueForToday,
    };
  }, [bookings, bookingsLoading]);

  const summaryStats = [
    { title: "Today's Arrivals", value: dashboardSummary.todayArrivals.toString(), icon: <CalendarCheck className="h-6 w-6 text-primary" />, link: "/checkin", linkText: "View Check-ins" },
    { title: "Available Rooms", value: dashboardSummary.availableRoomsDisplay, icon: <BedDouble className="h-6 w-6 text-primary" />, link: "/calendar", linkText: "View Calendar" },
    { title: "Today's Revenue (Est.)", value: `Rs. ${dashboardSummary.todaysRevenue.toFixed(2)}`, icon: <TrendingUp className="h-6 w-6 text-primary" />, link: "/revenue", linkText: "View Reports" },
  ];

  const quickActions = [
    { label: "Add New Booking", href: "/bookings/add", icon: <UserPlus className="mr-2 h-5 w-5" /> },
    { label: "View All Bookings", href: "/bookings", icon: <BedDouble className="mr-2 h-5 w-5" /> },
    { label: "Manage Calendar", href: "/calendar", icon: <CalendarCheck className="mr-2 h-5 w-5" /> },
  ];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 font-headline text-primary">Welcome to {APP_NAME}</h1>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {bookingsLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/2 mb-2" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-5 w-1/3" />
              </CardFooter>
            </Card>
          ))
        ) : (
          summaryStats.map((stat) => (
            <Card key={stat.title} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
              <CardFooter>
                <Button variant="link" asChild className="p-0 h-auto text-sm">
                  <Link href={stat.link}>
                    {stat.linkText} <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6 font-headline">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Button key={action.href} asChild size="lg" className="justify-start text-base py-6">
              <Link href={action.href}>
                {action.icon}
                {action.label}
              </Link>
            </Button>
          ))}
        </div>
      </section>
      
      <section className="mt-12">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Overview of recent bookings and check-ins.</CardDescription>
          </CardHeader>
          <CardContent>
             {bookingsLoading ? (
                <Skeleton className="h-10 w-full" />
            ) : bookings.length === 0 ? (
                 <p className="text-muted-foreground">No recent activity to display. Start by adding a new booking!</p>
            ): (
                 <p className="text-muted-foreground">Recent activity will be shown here. (Feature coming soon)</p>
            )}
            {/* Placeholder for recent activity list */}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

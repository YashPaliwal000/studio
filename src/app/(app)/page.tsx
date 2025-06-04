
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BedDouble, CalendarCheck, IndianRupee, UserPlus } from 'lucide-react';
import { ROOM_CONFIG } from '@/lib/constants'; // Assuming this will be needed for dynamic data

// Placeholder data for dashboard stats - replace with dynamic data fetching
const getDashboardSummary = () => {
  // In a real app, this data would come from useBookings or a similar hook/API call
  const todayArrivals = "3"; // Example
  const totalRooms = ROOM_CONFIG.length;
  const occupiedRoomsToday = 2; // Example: fetch from bookings for today
  const availableRooms = totalRooms - occupiedRoomsToday;
  const todaysRevenue = "4500"; // Example

  return {
    todayArrivals,
    availableRoomsDisplay: `${availableRooms} / ${totalRooms}`,
    todaysRevenue: `\u20B9${todaysRevenue}`,
  };
};


export default function DashboardPage() {
  const summary = getDashboardSummary();

  const summaryStats = [
    { title: "Today's Arrivals", value: summary.todayArrivals, icon: <CalendarCheck className="h-6 w-6 text-primary" />, link: "/checkin", linkText: "View Check-ins" },
    { title: "Available Rooms", value: summary.availableRoomsDisplay, icon: <BedDouble className="h-6 w-6 text-primary" />, link: "/calendar", linkText: "View Calendar" },
    { title: "Today's Revenue (Est.)", value: summary.todaysRevenue, icon: <IndianRupee className="h-6 w-6 text-primary" />, link: "/revenue", linkText: "View Reports" },
  ];

  const quickActions = [
    { label: "Add New Booking", href: "/bookings/add", icon: <UserPlus className="mr-2 h-5 w-5" /> },
    { label: "View All Bookings", href: "/bookings", icon: <BedDouble className="mr-2 h-5 w-5" /> },
    { label: "Manage Calendar", href: "/calendar", icon: <CalendarCheck className="mr-2 h-5 w-5" /> },
  ];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 font-headline text-primary">Welcome to Palis Nest</h1>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {summaryStats.map((stat) => (
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
        ))}
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
            <p className="text-muted-foreground">No recent activity to display. Start by adding a new booking!</p>
            {/* Placeholder for recent activity list */}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}


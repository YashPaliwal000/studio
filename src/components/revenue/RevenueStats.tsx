'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Booking } from '@/lib/types';
import { MAX_ROOMS } from '@/lib/constants';
import { IndianRupee, Percent, TrendingUp, Users } from 'lucide-react';
import { useMemo } from 'react';
import { differenceInDays, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

interface RevenueStatsProps {
  bookings: Booking[];
}

export default function RevenueStats({ bookings }: RevenueStatsProps) {
  const stats = useMemo(() => {
    const today = new Date();
    const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const relevantBookings = bookings.filter(b => b.status !== 'Cancelled');

    const totalRevenue = relevantBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    
    let occupiedRoomNights = 0;
    relevantBookings.forEach(b => {
      const checkIn = startOfDay(new Date(b.checkInDate));
      const checkOut = startOfDay(new Date(b.checkOutDate)); // Use start of checkout day
      if (checkOut > checkIn) { // Ensure checkout is after checkin
         // Only count nights within the current month for occupancy calculation, or overall
        const nights = differenceInDays(checkOut, checkIn);
        occupiedRoomNights += nights;
      }
    });

    // For occupancy, let's consider a period, e.g., last 30 days for simplicity
    const periodStart = subDays(today, 29); // Last 30 days
    const periodEnd = today;
    const totalRoomNightsInPeriod = MAX_ROOMS * 30; // 30 days period

    let occupiedRoomNightsInPeriod = 0;
    relevantBookings.forEach(b => {
        const bookingStart = startOfDay(new Date(b.checkInDate));
        const bookingEnd = startOfDay(new Date(b.checkOutDate));

        for (let d = new Date(periodStart); d <= periodEnd; d = new Date(d.setDate(d.getDate() + 1))) {
            if (d >= bookingStart && d < bookingEnd) { // Check if current day `d` falls within booking interval
                occupiedRoomNightsInPeriod++;
            }
        }
         // Reset date for next iteration
        new Date(periodStart).setDate(periodStart.getDate()-(30-differenceInDays(periodEnd, periodStart)));
    });
    occupiedRoomNightsInPeriod = occupiedRoomNightsInPeriod / MAX_ROOMS; // This needs refinement based on actual room nights

    const occupancyRate = totalRoomNightsInPeriod > 0 ? (occupiedRoomNightsInPeriod / totalRoomNightsInPeriod) * 100 : 0;
    
    const averageBookingValue = relevantBookings.length > 0 ? totalRevenue / relevantBookings.length : 0;

    const totalGuests = relevantBookings.reduce((sum, b) => sum + b.numberOfGuests, 0);

    return [
      { title: 'Total Revenue', value: `₹${totalRevenue.toFixed(2)}`, icon: <IndianRupee className="h-5 w-5 text-muted-foreground" /> },
      { title: 'Occupancy Rate (Last 30d)', value: `${occupancyRate.toFixed(1)}%`, icon: <Percent className="h-5 w-5 text-muted-foreground" /> },
      { title: 'Avg. Booking Value', value: `₹${averageBookingValue.toFixed(2)}`, icon: <TrendingUp className="h-5 w-5 text-muted-foreground" /> },
      { title: 'Total Guests (All Time)', value: totalGuests.toString(), icon: <Users className="h-5 w-5 text-muted-foreground" /> },
    ];
  }, [bookings]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => (
        <Card key={stat.title} className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            {stat.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

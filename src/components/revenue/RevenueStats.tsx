
'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Booking, RoomPrice } from '@/lib/types'; 
import { ROOM_CONFIG } from '@/lib/constants';
import { IndianRupee, Percent, TrendingUp, Users } from 'lucide-react';
import { useMemo } from 'react';
import { differenceInDays, subDays, isWithinInterval, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';

interface RevenueStatsProps {
  bookings: Booking[];
}

export default function RevenueStats({ bookings }: RevenueStatsProps) {
  const stats = useMemo(() => {
    const today = new Date();
    
    const relevantBookings = bookings.filter(b => b.status !== 'Cancelled');

    const totalRevenue = relevantBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    
    const periodStart = startOfDay(subDays(today, 29)); 
    const periodEnd = startOfDay(today); 
    const daysInPeriod = differenceInDays(periodEnd, periodStart) + 1;
    const totalPossibleRoomNightsInPeriod = ROOM_CONFIG.length * daysInPeriod;

    let occupiedRoomNightsInPeriod = 0;
    const interval = { start: periodStart, end: periodEnd };

    relevantBookings.forEach(b => {
      const bookingStart = startOfDay(new Date(b.checkInDate));
      const bookingEnd = startOfDay(new Date(b.checkOutDate)); 

      if (bookingEnd > bookingStart) { 
        const bookingDays = eachDayOfInterval({ start: bookingStart, end: subDays(bookingEnd,1) }); 
        
        bookingDays.forEach(dayOfStay => {
          if (isWithinInterval(dayOfStay, interval)) {
            occupiedRoomNightsInPeriod += b.roomNumbers.length; 
          }
        });
      }
    });
    
    const occupancyRate = totalPossibleRoomNightsInPeriod > 0 ? (occupiedRoomNightsInPeriod / totalPossibleRoomNightsInPeriod) * 100 : 0;
    
    const averageBookingValue = relevantBookings.length > 0 ? totalRevenue / relevantBookings.length : 0;

    const totalGuests = relevantBookings.reduce((sum, b) => sum + b.numberOfGuests, 0);

    return [
      { title: 'Total Revenue', value: `\u20B9${totalRevenue.toFixed(2)}`, icon: <IndianRupee className="h-5 w-5 text-muted-foreground" /> },
      { title: 'Occupancy Rate (Last 30d)', value: `${occupancyRate.toFixed(1)}%`, icon: <Percent className="h-5 w-5 text-muted-foreground" /> },
      { title: 'Avg. Booking Value', value: `\u20B9${averageBookingValue.toFixed(2)}`, icon: <TrendingUp className="h-5 w-5 text-muted-foreground" /> },
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


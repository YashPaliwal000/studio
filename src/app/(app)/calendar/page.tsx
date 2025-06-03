'use client';
import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { useBookings } from '@/hooks/useBookings';
import RoomAvailability from '@/components/calendar/RoomAvailability';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { bookings, loading: bookingsLoading } = useBookings();

  const bookedDatesModifiers = useMemo(() => {
    if (bookingsLoading) return { booked: [] };
    
    const bookedDays: Date[] = [];
    bookings.forEach(booking => {
      if (booking.status === 'Cancelled') return;
      let currentDate = new Date(booking.checkInDate);
      const endDate = new Date(booking.checkOutDate);
      while (currentDate < endDate) {
        bookedDays.push(new Date(currentDate));
        currentDate = addDays(currentDate, 1);
      }
    });
    return { booked: bookedDays };
  }, [bookings, bookingsLoading]);

  const bookedDatesModifiersStyles = {
    booked: {
      backgroundColor: 'hsl(var(--destructive) / 0.3)',
      color: 'hsl(var(--destructive-foreground) / 0.8)',
      borderRadius: 'var(--radius)',
    }
  };

  if (bookingsLoading) {
    return (
      <div className="py-8">
        <h1 className="text-3xl font-bold mb-8 font-headline text-primary">Booking Calendar</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-lg">
            <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
            <CardContent className="flex justify-center">
              <Skeleton className="w-[280px] h-[320px] rounded-md" />
            </CardContent>
          </Card>
          <div className="space-y-4">
            <Card className="shadow-lg"><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
            <Card className="shadow-lg"><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-8 font-headline text-primary">Booking Calendar</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="lg:col-span-2 shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Select a Date</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center p-2 sm:p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border p-0"
              modifiers={bookedDatesModifiers}
              modifiersStyles={bookedDatesModifiersStyles}
              disabled={(date) => date < addDays(new Date(), -1*365) || date > addDays(new Date(), 365) } // Example: 1 year past/future
            />
          </CardContent>
        </Card>
        
        <div className="lg:col-span-1">
        {selectedDate && (
          <RoomAvailability selectedDate={selectedDate} bookings={bookings} />
        )}
        </div>
      </div>
    </div>
  );
}

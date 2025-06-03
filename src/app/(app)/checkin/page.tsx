'use client';
import { useState, useMemo } from 'react';
import { format, isToday, parseISO } from 'date-fns';
import { useBookings } from '@/hooks/useBookings';
import CheckInItem from '@/components/checkin/CheckInItem';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Search } from 'lucide-react';

export default function CheckInPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { bookings, updateBookingStatus, loading } = useBookings();
  const { toast } = useToast();

  const arrivalsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return bookings.filter(
      (booking) =>
        format(new Date(booking.checkInDate), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') &&
        (booking.status === 'Confirmed' || booking.status === 'CheckedIn')
    ).sort((a,b) => a.roomNumber - b.roomNumber);
  }, [bookings, selectedDate]);

  const handleCheckIn = (id: string) => {
    updateBookingStatus(id, 'CheckedIn');
    toast({
      title: 'Guest Checked In',
      description: 'The guest has been successfully marked as checked in.',
    });
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-full sm:w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold font-headline text-primary">Daily Check-ins</h1>
        <div className="w-full sm:w-auto">
          <DatePicker date={selectedDate} setDate={setSelectedDate} placeholder="Select Check-in Date" />
        </div>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-xl">
            Arrivals for: {selectedDate ? format(selectedDate, 'PPP') : 'Select a date'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {arrivalsForSelectedDate.length === 0 ? (
            <div className="text-center py-10">
              <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-xl text-muted-foreground">No arrivals scheduled for this date.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {arrivalsForSelectedDate.map((booking) => (
                <CheckInItem key={booking.id} booking={booking} onCheckIn={handleCheckIn} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="p-4 border rounded-lg shadow space-y-3">
      <div className="flex justify-between items-start">
        <Skeleton className="h-6 w-3/5" />
        <Skeleton className="h-5 w-1/4" />
      </div>
      <Skeleton className="h-4 w-1/3" />
      <div className="space-y-1 pt-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="flex justify-end pt-2">
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
}

'use client';
import BookingForm from '@/components/bookings/BookingForm';
import { useBookings } from '@/hooks/useBookings';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Booking } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EditBookingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getBookingById, updateBooking } = useBookings();
  const [initialData, setInitialData] = useState<Booking | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const booking = getBookingById(id as string);
      if (booking) {
        setInitialData(booking);
      } else {
        setError('Booking not found.');
      }
      setLoading(false);
    }
  }, [id, getBookingById]);

  const handleSubmit = async (data: Partial<Omit<Booking, 'id' | 'createdAt'>>) => {
    if (!id) return;
    // Ensure dates are Date objects if not already
    const bookingData = {
        ...data,
        checkInDate: data.checkInDate ? new Date(data.checkInDate) : undefined,
        checkOutDate: data.checkOutDate ? new Date(data.checkOutDate) : undefined,
      };
    return updateBooking(id as string, bookingData);
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-10 w-1/3 mt-4" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-destructive">
        <p>{error}</p>
        <Button onClick={() => router.push('/bookings')} className="mt-4">Go to Bookings</Button>
      </div>
    );
  }
  
  if (!initialData) {
     return (
      <div className="py-8 text-center">
        <p>Booking data could not be loaded.</p>
        <Button onClick={() => router.push('/bookings')} className="mt-4">Go to Bookings</Button>
      </div>
    );
  }

  return (
    <div className="py-8">
      <BookingForm initialData={initialData} onSubmit={handleSubmit} isEditMode={true} />
    </div>
  );
}

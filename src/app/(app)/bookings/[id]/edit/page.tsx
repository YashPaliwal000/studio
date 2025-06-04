
'use client';
import BookingForm from '@/components/bookings/BookingForm';
import type { BookingFormValues } from '@/components/bookings/BookingForm';
import { useBookings } from '@/hooks/useBookings';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Booking } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { differenceInDays } from 'date-fns';

export default function EditBookingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getBookingById, updateBooking } = useBookings();
  const [initialDataForForm, setInitialDataForForm] = useState<Partial<BookingFormValues> | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const booking = getBookingById(id as string);
      if (booking) {
        const { totalAmount, createdAt, updatedAt, ...formData } = booking;
        setInitialDataForForm({
          ...formData,
          roomNumbers: booking.roomNumbers, // Ensure this is passed as an array
          checkInDate: new Date(booking.checkInDate),
          checkOutDate: new Date(booking.checkOutDate),
          pricePerNight: booking.pricePerNight,
        });
      } else {
        setError('Booking not found.');
      }
      setLoading(false);
    }
  }, [id, getBookingById]);

  const handleSubmit = async (data: BookingFormValues) => {
    if (!id) return;

    const checkIn = new Date(data.checkInDate);
    const checkOut = new Date(data.checkOutDate);

    let nights = differenceInDays(checkOut, checkIn);
     if (nights <= 0) {
      nights = 1;
    }
    const numberOfSelectedRooms = data.roomNumbers.length;
    const totalAmount = data.pricePerNight * nights * numberOfSelectedRooms;

    const bookingDataToUpdate: Partial<Omit<Booking, 'id' | 'createdAt'>> = {
        ...data,
        roomNumbers: data.roomNumbers,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        pricePerNight: data.pricePerNight,
        totalAmount: totalAmount,
      };
    return updateBooking(id as string, bookingDataToUpdate);
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(7)].map((_, i) => ( // Increased skeleton items for roomNumbers and pricePerNight
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
  
  if (!initialDataForForm) {
     return (
      <div className="py-8 text-center">
        <p>Booking data could not be loaded.</p>
        <Button onClick={() => router.push('/bookings')} className="mt-4">Go to Bookings</Button>
      </div>
    );
  }

  return (
    <div className="py-8">
      <BookingForm initialData={initialDataForForm} onSubmit={handleSubmit} isEditMode={true} />
    </div>
  );
}

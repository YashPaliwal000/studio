
'use client';
import BookingForm from '@/components/bookings/BookingForm';
import type { BookingFormValues } from '@/components/bookings/BookingForm';
import { useBookings } from '@/hooks/useBookings';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Booking, RoomPrice } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { differenceInDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function EditBookingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getBookingById, updateBooking, bookings: allBookings, loading: bookingsLoadingHook } = useBookings();
  const [initialDataForForm, setInitialDataForForm] = useState<Partial<BookingFormValues & { id?: string; roomPrices?: RoomPrice[] } > | undefined>(undefined);
  const [loadingPage, setLoadingPage] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (bookingsLoadingHook) return; // Wait for all bookings to load

    if (id) {
      const booking = getBookingById(id as string);
      if (booking) {
        const { totalAmount, createdAt, updatedAt, ...formData } = booking;
         const formValues: Partial<BookingFormValues & { id: string; roomPrices?: RoomPrice[] }> = {
          ...formData,
          id: booking.id, // Pass ID for conflict checking in BookingForm
          roomNumbers: booking.roomNumbers,
          checkInDate: new Date(booking.checkInDate),
          checkOutDate: new Date(booking.checkOutDate),
          roomPriceDetails: booking.roomPrices.map(rp => ({ roomNumber: rp.roomNumber, price: rp.price })),
          roomPrices: booking.roomPrices, 
        };
        setInitialDataForForm(formValues);
      } else {
        setError('Booking not found.');
      }
      setLoadingPage(false);
    }
  }, [id, getBookingById, bookingsLoadingHook]);

  const handleSubmit = async (data: BookingFormValues) => {
    if (!id) return Promise.reject(new Error('Booking ID is missing'));

    const checkIn = new Date(data.checkInDate);
    const checkOut = new Date(data.checkOutDate);

    // Final conflict check before submission
    for (const roomNum of data.roomNumbers) {
      for (const existingBooking of allBookings) {
        if (existingBooking.id === id) continue; // Skip self
        if (existingBooking.status === 'Cancelled') continue;
        if (!existingBooking.roomNumbers.includes(roomNum)) continue;

        const existingCheckIn = new Date(existingBooking.checkInDate);
        const existingCheckOut = new Date(existingBooking.checkOutDate);

        if (checkIn < existingCheckOut && checkOut > existingCheckIn) {
          toast({
            title: 'Booking Conflict',
            description: `Room ${roomNum} is already booked for the selected dates. Please choose different rooms or dates.`,
            variant: 'destructive',
          });
          return Promise.reject(new Error('Booking conflict')); // Reject promise
        }
      }
    }

    let nights = differenceInDays(checkOut, checkIn);
     if (nights <= 0) {
      nights = 1;
    }

    const roomPrices: RoomPrice[] = data.roomPriceDetails.map(rpd => ({
      roomNumber: rpd.roomNumber,
      price: rpd.price,
    }));
    
    const totalAmount = roomPrices.reduce((sum, room) => {
      return sum + (room.price * nights);
    }, 0);

    const bookingDataToUpdate: Partial<Omit<Booking, 'id' | 'createdAt'>> = {
        guestName: data.guestName,
        guestContact: data.guestContact,
        roomNumbers: data.roomNumbers,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfGuests: data.numberOfGuests,
        roomPrices: roomPrices,
        totalAmount: totalAmount,
        status: data.status,
        bookingSource: data.bookingSource,
        notes: data.notes,
      };
    return updateBooking(id as string, bookingDataToUpdate);
  };

  if (loadingPage || bookingsLoadingHook) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(8)].map((_, i) => ( 
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
      <BookingForm 
        initialData={initialDataForForm} 
        onSubmit={handleSubmit} 
        isEditMode={true}
        currentBookingId={id as string} 
      />
    </div>
  );
}

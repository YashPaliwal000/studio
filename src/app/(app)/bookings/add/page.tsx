
'use client';
import BookingForm from '@/components/bookings/BookingForm';
import type { BookingFormValues } from '@/components/bookings/BookingForm';
import { useBookings } from '@/hooks/useBookings';
import type { Booking, RoomPrice } from '@/lib/types';
import { differenceInDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function AddBookingPage() {
  const { addBooking, bookings: allBookings, loading: bookingsLoading } = useBookings();
  const { toast } = useToast();

  const handleSubmit = async (data: BookingFormValues) => {
    const checkIn = new Date(data.checkInDate);
    const checkOut = new Date(data.checkOutDate);
    
    // Final conflict check before submission
    for (const roomNum of data.roomNumbers) {
      for (const existingBooking of allBookings) {
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
          return Promise.reject(new Error('Booking conflict')); // Reject promise to indicate failure
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

    const bookingDataToSave: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> = {
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
    
    return addBooking(bookingDataToSave);
  };

  return (
    <div className="py-8">
      <BookingForm onSubmit={handleSubmit} />
    </div>
  );
}

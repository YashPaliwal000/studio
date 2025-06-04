
'use client';
import BookingForm from '@/components/bookings/BookingForm';
import type { BookingFormValues } from '@/components/bookings/BookingForm';
import { useBookings } from '@/hooks/useBookings';
import type { Booking, RoomPrice } from '@/lib/types';
import { differenceInDays } from 'date-fns';

export default function AddBookingPage() {
  const { addBooking } = useBookings();

  const handleSubmit = async (data: BookingFormValues) => {
    const checkIn = new Date(data.checkInDate);
    const checkOut = new Date(data.checkOutDate);
    
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

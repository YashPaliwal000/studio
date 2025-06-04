
'use client';
import BookingForm from '@/components/bookings/BookingForm';
import type { BookingFormValues } from '@/components/bookings/BookingForm';
import { useBookings } from '@/hooks/useBookings';
import type { Booking } from '@/lib/types';
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
    
    const numberOfSelectedRooms = data.roomNumbers.length;
    const totalAmount = data.pricePerNight * nights * numberOfSelectedRooms;

    const bookingDataToSave: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> = {
      ...data,
      roomNumbers: data.roomNumbers, // Ensure this is passed
      checkInDate: checkIn,
      checkOutDate: checkOut,
      pricePerNight: data.pricePerNight,
      totalAmount: totalAmount,
    };
    
    return addBooking(bookingDataToSave);
  };

  return (
    <div className="py-8">
      <BookingForm onSubmit={handleSubmit} />
    </div>
  );
}

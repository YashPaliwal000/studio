
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
      // This case should ideally be caught by form validation,
      // but as a safeguard or if specific logic for min 1 night total is needed:
      nights = 1; 
    }
    
    const totalAmount = data.pricePerNight * nights;

    const bookingDataToSave: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> = {
      ...data,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      pricePerNight: data.pricePerNight,
      totalAmount: totalAmount,
      // Ensure all other fields from Booking type are present if not optional
      // guestName, guestContact, roomNumber, numberOfGuests, status are from 'data'
      // bookingSource, notes are optional and also from 'data'
    };
    
    return addBooking(bookingDataToSave);
  };

  return (
    <div className="py-8">
      {/* Default values for pricePerNight etc. are handled within BookingForm */}
      <BookingForm onSubmit={handleSubmit} />
    </div>
  );
}

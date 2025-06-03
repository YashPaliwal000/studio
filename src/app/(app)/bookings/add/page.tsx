'use client';
import BookingForm from '@/components/bookings/BookingForm';
import { useBookings } from '@/hooks/useBookings';
import type { Booking } from '@/lib/types';

export default function AddBookingPage() {
  const { addBooking } = useBookings();

  const handleSubmit = async (data: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => {
    // The data from form is already mostly Omit<Booking, 'id' | 'createdAt'>
    // Ensure dates are Date objects if not already
    const bookingData = {
      ...data,
      checkInDate: new Date(data.checkInDate),
      checkOutDate: new Date(data.checkOutDate),
    };
    return addBooking(bookingData);
  };

  return (
    <div className="py-8">
      <BookingForm onSubmit={handleSubmit} />
    </div>
  );
}

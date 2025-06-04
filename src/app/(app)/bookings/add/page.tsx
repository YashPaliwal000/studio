
'use client';
import BookingForm from '@/components/bookings/BookingForm';
import type { BookingFormValues } from '@/components/bookings/BookingForm';
import { useBookings } from '@/hooks/useBookings';
import type { Booking, RoomPrice, ExtraItem } from '@/lib/types';
import { differenceInDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { nanoid } from 'nanoid';

export default function AddBookingPage() {
  const { addBooking, bookings: allBookings, loading: bookingsLoading } = useBookings();
  const { toast } = useToast();

  const handleSubmit = async (data: BookingFormValues) => {
    const checkIn = new Date(data.checkInDate);
    const checkOut = new Date(data.checkOutDate);
    
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
          return Promise.reject(new Error('Booking conflict')); 
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

    const totalRoomAmount = roomPrices.reduce((sum, room) => {
      return sum + (room.price * nights);
    }, 0);

    const extraItemsToSave: ExtraItem[] = (data.extraItems || []).map(item => ({
      id: item.id || nanoid(), // Ensure ID for items that might not have one from form
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      unit: item.unit,
    }));

    const totalExtraItemsAmount = extraItemsToSave.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
    }, 0);

    const totalAmount = totalRoomAmount + totalExtraItemsAmount;

    const bookingDataToSave: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> = {
      guestName: data.guestName,
      guestContact: data.guestContact,
      roomNumbers: data.roomNumbers,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfGuests: data.numberOfGuests,
      roomPrices: roomPrices,
      extraItems: extraItemsToSave,
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

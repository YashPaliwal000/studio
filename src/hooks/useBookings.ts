
'use client';
import { useState, useCallback, useEffect } from 'react';
import type { Booking, BookingStatus, BookingSource, RoomPrice, ExtraItem } from '@/lib/types';
import { ROOM_CONFIG } from '@/lib/constants';
import { nanoid } from 'nanoid';
import { differenceInDays } from 'date-fns';

const calculateNights = (checkIn: Date, checkOut: Date): number => {
  const nights = differenceInDays(new Date(checkOut), new Date(checkIn));
  return nights > 0 ? nights : 1;
};

const generateClientInitialBookings = (): Booking[] => {
  const today = new Date();
  const initialDataRaw = [
    {
      id: nanoid(),
      guestName: 'Charlie Fallback',
      guestContact: 'charlie@example.com',
      roomNumbers: [ROOM_CONFIG[0].id],
      checkInDate: new Date(new Date(today).setDate(today.getDate() + 5)),
      checkOutDate: new Date(new Date(today).setDate(today.getDate() + 7)),
      numberOfGuests: 2,
      roomPrices: [{ roomNumber: ROOM_CONFIG[0].id, price: ROOM_CONFIG[0].defaultPrice }],
      extraItems: [] as ExtraItem[],
      advancePayment: 0,
      discount: 0,
      status: 'Confirmed' as BookingStatus,
      bookingSource: 'Online' as BookingSource,
      createdAt: new Date(),
    },
  ];
  return initialDataRaw.map(b => {
    const nights = calculateNights(b.checkInDate, b.checkOutDate);
    const roomTotal = b.roomPrices.reduce((sum, rp) => sum + (rp.price * nights), 0);
    const extraItemsTotal = b.extraItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return {
      ...b,
      totalAmount: roomTotal + extraItemsTotal, // Gross total
    };
  });
};


export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parseBookingData = (booking: any): Booking => {
    const parsed = {
      ...booking,
      roomNumbers: Array.isArray(booking.roomNumbers) ? booking.roomNumbers : (typeof booking.roomNumber === 'number' ? [booking.roomNumber] : [ROOM_CONFIG[0].id]),
      checkInDate: new Date(booking.checkInDate),
      checkOutDate: new Date(booking.checkOutDate),
      createdAt: new Date(booking.createdAt),
      updatedAt: booking.updatedAt ? new Date(booking.updatedAt) : undefined,
      extraItems: Array.isArray(booking.extraItems) ? booking.extraItems.map((ei: any) => ({...ei, id: ei.id || nanoid()})) : [],
      advancePayment: typeof booking.advancePayment === 'number' ? booking.advancePayment : 0,
      discount: typeof booking.discount === 'number' ? booking.discount : 0,
    };

    const nights = calculateNights(parsed.checkInDate, parsed.checkOutDate);

    if (!parsed.roomPrices && parsed.pricePerNight) { 
      parsed.roomPrices = parsed.roomNumbers.map((rn: number) => ({
        roomNumber: rn,
        price: parsed.pricePerNight,
      }));
      delete parsed.pricePerNight; 
    } else if (!parsed.roomPrices || parsed.roomPrices.length === 0) { 
        parsed.roomPrices = parsed.roomNumbers.map((rn: number) => {
            const roomConfig = ROOM_CONFIG.find(rc => rc.id === rn);
            return {
                roomNumber: rn,
                price: roomConfig ? roomConfig.defaultPrice : 1500, 
            };
        });
    }
    
    const roomTotal = parsed.roomPrices.reduce((sum: number, rp: RoomPrice) => sum + (rp.price * nights), 0);
    const extraItemsTotal = parsed.extraItems.reduce((sum: number, item: ExtraItem) => sum + (item.price * item.quantity), 0);
    parsed.totalAmount = roomTotal + extraItemsTotal; // Gross total


    return parsed;
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/bookings');
      if (!response.ok) {
        throw new Error(`Failed to fetch bookings: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        console.warn("Received non-array data from /api/bookings, falling back to client initial.");
        setBookings(generateClientInitialBookings().map(parseBookingData)); 
        throw new Error("Invalid data format from server.");
      }
      setBookings(data.map(parseBookingData));
    } catch (e: any) {
      console.error("Error fetching bookings:", e);
      setError(e.message || 'Failed to load bookings.');
      setBookings(generateClientInitialBookings().map(parseBookingData)); 
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const saveBookingsToApi = async (updatedBookings: Booking[]) => {
    setLoading(true); 
    setError(null);
    try {
      const bookingsToSave = updatedBookings.map(booking => {
        
        const nights = calculateNights(new Date(booking.checkInDate), new Date(booking.checkOutDate));
        const roomTotal = booking.roomPrices.reduce((sum, rp) => sum + (rp.price * nights), 0);
        const extraItemsTotal = (booking.extraItems || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const calculatedTotalAmount = roomTotal + extraItemsTotal; // Gross total

        return {
          ...booking,
          checkInDate: new Date(booking.checkInDate).toISOString(),
          checkOutDate: new Date(booking.checkOutDate).toISOString(),
          createdAt: new Date(booking.createdAt).toISOString(),
          updatedAt: booking.updatedAt ? new Date(booking.updatedAt).toISOString() : undefined,
          extraItems: (booking.extraItems || []).map(ei => ({...ei, id: ei.id || nanoid()})),
          totalAmount: calculatedTotalAmount, 
          advancePayment: booking.advancePayment || 0,
          discount: booking.discount || 0,
        };
      });

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingsToSave),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to save bookings' }));
        throw new Error(errorData.message || `Failed to save bookings: ${response.status}`);
      }
      setBookings(updatedBookings.map(parseBookingData)); 
    } catch (e: any) {
      console.error("Error saving bookings:", e);
      setError(e.message || 'Failed to save bookings.');
      throw e; 
    } finally {
      setLoading(false); 
    }
  };

  const addBooking = useCallback(async (newBookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => {
    const nights = calculateNights(new Date(newBookingData.checkInDate), new Date(newBookingData.checkOutDate));
    const roomTotal = newBookingData.roomPrices.reduce((sum, rp) => sum + (rp.price * nights), 0);
    const extraItemsTotal = (newBookingData.extraItems || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const grossTotalAmount = roomTotal + extraItemsTotal;

    const bookingWithId: Booking = {
      ...newBookingData,
      id: nanoid(),
      createdAt: new Date(),
      extraItems: (newBookingData.extraItems || []).map(ei => ({...ei, id: ei.id || nanoid()})),
      totalAmount: grossTotalAmount, // Gross total
      advancePayment: newBookingData.advancePayment || 0,
      discount: newBookingData.discount || 0,
    };
    const newBookingsArray = [...bookings, bookingWithId];
    await saveBookingsToApi(newBookingsArray);
    return bookingWithId;
  }, [bookings]);

  const updateBooking = useCallback(async (id: string, updatedBookingData: Partial<Omit<Booking, 'id' | 'createdAt'>>) => {
    let updatedBooking: Booking | undefined;

    const nights = calculateNights(new Date(updatedBookingData.checkInDate!), new Date(updatedBookingData.checkOutDate!));
    const roomTotal = updatedBookingData.roomPrices!.reduce((sum, rp) => sum + (rp.price * nights), 0);
    const extraItemsTotal = (updatedBookingData.extraItems || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const grossTotalAmount = roomTotal + extraItemsTotal;
    
    const newBookingsArray = bookings.map((booking) => {
      if (booking.id === id) {
        updatedBooking = { 
          ...booking, 
          ...updatedBookingData, 
          extraItems: (updatedBookingData.extraItems || []).map(ei => ({...ei, id: ei.id || nanoid()})),
          totalAmount: grossTotalAmount, // Gross total
          advancePayment: updatedBookingData.advancePayment || 0,
          discount: updatedBookingData.discount || 0,
          updatedAt: new Date() 
        };
        return updatedBooking;
      }
      return booking;
    });
    if (updatedBooking) {
      await saveBookingsToApi(newBookingsArray);
    }
    return updatedBooking;
  }, [bookings]);

  const getBookingById = useCallback((id: string): Booking | undefined => {
    return bookings.find((booking) => booking.id === id);
  }, [bookings]);

  const deleteBooking = useCallback(async (id: string) => {
    const newBookingsArray = bookings.filter(b => b.id !== id);
    await saveBookingsToApi(newBookingsArray);
  }, [bookings]);

  const updateBookingStatus = useCallback(async (id: string, status: BookingStatus) => {
    const newBookingsArray = bookings.map((booking) =>
      booking.id === id ? { ...booking, status, updatedAt: new Date() } : booking
    );
    await saveBookingsToApi(newBookingsArray);
  }, [bookings]);
  
  return { bookings, addBooking, updateBooking, getBookingById, deleteBooking, updateBookingStatus, loading, error, refetchBookings: fetchBookings };
}

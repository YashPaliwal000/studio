
'use client';
import { useState, useCallback, useEffect } from 'react';
import type { Booking, BookingStatus, BookingSource, RoomPrice } from '@/lib/types';
import { nanoid } from 'nanoid';
import { differenceInDays } from 'date-fns';

const calculateNights = (checkIn: Date, checkOut: Date): number => {
  const nights = differenceInDays(new Date(checkOut), new Date(checkIn));
  return nights > 0 ? nights : 1;
};

const DEFAULT_ROOM_PRICE_FALLBACK = 1500;

const generateClientInitialBookings = (): Booking[] => {
  const today = new Date();
  const initialDataRaw = [
    {
      id: nanoid(),
      guestName: 'Charlie Fallback',
      guestContact: 'charlie@example.com',
      roomNumbers: [3],
      checkInDate: new Date(new Date(today).setDate(today.getDate() + 5)),
      checkOutDate: new Date(new Date(today).setDate(today.getDate() + 7)),
      numberOfGuests: 2,
      // Provide initial roomPrices structure
      roomPrices: [{ roomNumber: 3, price: 160 }],
      status: 'Confirmed' as BookingStatus,
      bookingSource: 'Online' as BookingSource,
      createdAt: new Date(),
    },
  ];
  return initialDataRaw.map(b => {
    const nights = calculateNights(b.checkInDate, b.checkOutDate);
    const totalAmount = b.roomPrices.reduce((sum, rp) => sum + (rp.price * nights), 0);
    return {
      ...b,
      totalAmount,
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
      roomNumbers: Array.isArray(booking.roomNumbers) ? booking.roomNumbers : (typeof booking.roomNumber === 'number' ? [booking.roomNumber] : [1]),
      checkInDate: new Date(booking.checkInDate),
      checkOutDate: new Date(booking.checkOutDate),
      createdAt: new Date(booking.createdAt),
      updatedAt: booking.updatedAt ? new Date(booking.updatedAt) : undefined,
    };

    // Migration for old data structure (pricePerNight to roomPrices)
    if (!parsed.roomPrices && parsed.pricePerNight) {
      parsed.roomPrices = parsed.roomNumbers.map((rn: number) => ({
        roomNumber: rn,
        price: parsed.pricePerNight,
      }));
      // Recalculate totalAmount if it was based on old pricePerNight * numRooms
      const nights = calculateNights(parsed.checkInDate, parsed.checkOutDate);
      parsed.totalAmount = parsed.roomPrices.reduce((sum: number, rp: RoomPrice) => sum + (rp.price * nights), 0);
      delete parsed.pricePerNight; // Remove old field
    } else if (!parsed.roomPrices) { // Fallback if pricePerNight is also missing
        parsed.roomPrices = parsed.roomNumbers.map((rn: number) => ({
            roomNumber: rn,
            price: DEFAULT_ROOM_PRICE_FALLBACK,
        }));
        const nights = calculateNights(parsed.checkInDate, parsed.checkOutDate);
        parsed.totalAmount = parsed.roomPrices.reduce((sum: number, rp: RoomPrice) => sum + (rp.price * nights), 0);
    }


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
        setBookings(generateClientInitialBookings().map(parseBookingData)); // Parse fallback as well
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
        // Ensure dates are ISO strings, remove any client-specific objects if necessary
        const { pricePerNight, ...bookingWithoutOldPrice } = booking as any; // Handle potential old field
        return {
          ...bookingWithoutOldPrice,
          checkInDate: new Date(booking.checkInDate).toISOString(),
          checkOutDate: new Date(booking.checkOutDate).toISOString(),
          createdAt: new Date(booking.createdAt).toISOString(),
          updatedAt: booking.updatedAt ? new Date(booking.updatedAt).toISOString() : undefined,
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
    const bookingWithId: Booking = {
      ...newBookingData,
      id: nanoid(),
      createdAt: new Date(),
    };
    const newBookingsArray = [...bookings, bookingWithId];
    await saveBookingsToApi(newBookingsArray);
    return bookingWithId;
  }, [bookings]);

  const updateBooking = useCallback(async (id: string, updatedBookingData: Partial<Omit<Booking, 'id' | 'createdAt'>>) => {
    let updatedBooking: Booking | undefined;
    const newBookingsArray = bookings.map((booking) => {
      if (booking.id === id) {
        updatedBooking = { ...booking, ...updatedBookingData, updatedAt: new Date() };
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

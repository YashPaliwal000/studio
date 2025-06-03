
'use client';
import { useState, useCallback, useEffect } from 'react';
import type { Booking, BookingStatus } from '@/lib/types';
import { nanoid } from 'nanoid';
import { differenceInDays } from 'date-fns';

// Helper to calculate number of nights (remains client-side for form logic etc.)
const calculateNights = (checkIn: Date, checkOut: Date): number => {
  const nights = differenceInDays(new Date(checkOut), new Date(checkIn));
  return nights > 0 ? nights : 0; // Or 1 if min 1 night policy
};

// Client-side initial bookings, used if API fails catastrophically or as a reference.
// The server will manage its own initial set in data/bookings.json.
const generateClientInitialBookings = (): Booking[] => {
  const today = new Date();
  const initialData = [
    {
      id: nanoid(),
      guestName: 'Charlie Fallback',
      guestContact: 'charlie@example.com',
      roomNumber: 3,
      checkInDate: new Date(new Date(today).setDate(today.getDate() + 5)),
      checkOutDate: new Date(new Date(today).setDate(today.getDate() + 7)),
      numberOfGuests: 2,
      pricePerNight: 160,
      status: 'Confirmed' as BookingStatus,
      bookingSource: 'Online' as BookingSource,
      createdAt: new Date(),
    },
  ];
  return initialData.map(b => ({
    ...b,
    totalAmount: b.pricePerNight * calculateNights(b.checkInDate, b.checkOutDate),
  }));
};


export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parseBookingDates = (booking: any): Booking => ({
    ...booking,
    checkInDate: new Date(booking.checkInDate),
    checkOutDate: new Date(booking.checkOutDate),
    createdAt: new Date(booking.createdAt),
    updatedAt: booking.updatedAt ? new Date(booking.updatedAt) : undefined,
  });

  // Fetch bookings from API
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
        setBookings(generateClientInitialBookings());
        throw new Error("Invalid data format from server.");
      }
      setBookings(data.map(parseBookingDates));
    } catch (e: any) {
      console.error("Error fetching bookings:", e);
      setError(e.message || 'Failed to load bookings.');
      setBookings(generateClientInitialBookings()); // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Save all bookings to API
  const saveBookingsToApi = async (updatedBookings: Booking[]) => {
    setLoading(true); // Or a more specific 'saving' state
    setError(null);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBookings), // API expects array of all bookings
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to save bookings' }));
        throw new Error(errorData.message || `Failed to save bookings: ${response.status}`);
      }
      setBookings(updatedBookings.map(parseBookingDates)); // Update local state with what was saved
    } catch (e: any) {
      console.error("Error saving bookings:", e);
      setError(e.message || 'Failed to save bookings.');
      throw e; // Re-throw so caller can handle
    } finally {
      setLoading(false); // Or clear 'saving' state
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
    return bookingWithId; // Return the newly added booking
  }, [bookings]); // Removed saveBookingsToApi from deps as it's stable if not memoized

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

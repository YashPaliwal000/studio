
'use client';
import { useState, useCallback, useEffect } from 'react';
import type { Booking, BookingStatus } from '@/lib/types';
import { nanoid } from 'nanoid';
import { differenceInDays } from 'date-fns';

// Helper to calculate number of nights
const calculateNights = (checkIn: Date, checkOut: Date): number => {
  const nights = differenceInDays(new Date(checkOut), new Date(checkIn));
  return nights > 0 ? nights : 0;
};

const initialBookingsData = [
  {
    id: nanoid(),
    guestName: 'Alice Wonderland',
    guestContact: 'alice@example.com',
    roomNumber: 1,
    checkInDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    checkOutDate: new Date(new Date().setDate(new Date().getDate() + 3)), // 2 nights
    numberOfGuests: 2,
    pricePerNight: 150,
    status: 'Confirmed',
    bookingSource: 'Online',
    createdAt: new Date(),
  },
  {
    id: nanoid(),
    guestName: 'Bob The Builder',
    guestContact: 'bob@example.com',
    roomNumber: 2,
    checkInDate: new Date(new Date().setDate(new Date().getDate() + 2)),
    checkOutDate: new Date(new Date().setDate(new Date().getDate() + 5)), // 3 nights
    numberOfGuests: 1,
    pricePerNight: 120,
    status: 'Confirmed',
    bookingSource: 'Phone',
    createdAt: new Date(),
  },
];

// Calculate totalAmount for initial bookings
const initialBookings: Booking[] = initialBookingsData.map(b => {
  const nights = calculateNights(b.checkInDate, b.checkOutDate);
  return {
    ...b,
    totalAmount: b.pricePerNight * nights,
  };
});


export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedBookings = localStorage.getItem('homestayBookings');
    if (storedBookings) {
      setBookings(JSON.parse(storedBookings).map((b: any) => {
        const checkInDate = new Date(b.checkInDate);
        const checkOutDate = new Date(b.checkOutDate);
        const nights = calculateNights(checkInDate, checkOutDate);
        
        // For backward compatibility with old data that might not have pricePerNight
        let pricePerNight = b.pricePerNight;
        let totalAmount = b.totalAmount;

        if (typeof b.pricePerNight === 'undefined' && typeof b.totalAmount !== 'undefined') {
          pricePerNight = nights > 0 ? b.totalAmount / nights : b.totalAmount;
        } else if (typeof b.pricePerNight !== 'undefined' && typeof b.totalAmount === 'undefined') {
          totalAmount = b.pricePerNight * nights;
        } else if (typeof b.pricePerNight === 'undefined' && typeof b.totalAmount === 'undefined') {
          pricePerNight = 0;
          totalAmount = 0;
        }


        return {
          ...b,
          checkInDate,
          checkOutDate,
          pricePerNight: Number(pricePerNight) || 0,
          totalAmount: Number(totalAmount) || 0,
          createdAt: new Date(b.createdAt),
          updatedAt: b.updatedAt ? new Date(b.updatedAt) : undefined,
        };
      }));
    } else {
      setBookings(initialBookings.map(b => ({
        ...b,
        checkInDate: new Date(b.checkInDate),
        checkOutDate: new Date(b.checkOutDate),
        createdAt: new Date(b.createdAt),
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('homestayBookings', JSON.stringify(bookings));
    }
  }, [bookings, loading]);

  const addBooking = useCallback((newBookingData: Omit<Booking, 'id' | 'createdAt'>) => {
    // totalAmount should be pre-calculated and passed in newBookingData
    const bookingWithId: Booking = {
      ...newBookingData,
      id: nanoid(),
      createdAt: new Date(),
    };
    setBookings((prevBookings) => [...prevBookings, bookingWithId]);
    return bookingWithId;
  }, []);

  const updateBooking = useCallback((id: string, updatedBookingData: Partial<Omit<Booking, 'id' | 'createdAt'>>) => {
    // totalAmount should be pre-calculated and passed in updatedBookingData if pricePerNight or dates change
    let finalBooking: Booking | undefined;
    setBookings((prevBookings) =>
      prevBookings.map((booking) => {
        if (booking.id === id) {
          finalBooking = { ...booking, ...updatedBookingData, updatedAt: new Date() };
          return finalBooking;
        }
        return booking;
      })
    );
    return finalBooking;
  }, []);

  const getBookingById = useCallback((id: string) => {
    return bookings.find((booking) => booking.id === id);
  }, [bookings]);

  const deleteBooking = useCallback((id: string) => {
    setBookings((prevBookings) => prevBookings.filter(b => b.id !== id));
  }, []);

  const updateBookingStatus = useCallback((id: string, status: BookingStatus) => {
    setBookings((prevBookings) =>
      prevBookings.map((booking) =>
        booking.id === id ? { ...booking, status, updatedAt: new Date() } : booking
      )
    );
  }, []);
  
  return { bookings, addBooking, updateBooking, getBookingById, deleteBooking, updateBookingStatus, loading };
}

'use client';
import { useState, useCallback, useEffect } from 'react';
import type { Booking, BookingStatus } from '@/lib/types';
import { nanoid } from 'nanoid'; // You might need to install nanoid: npm install nanoid

// Helper to generate unique IDs, nanoid is small and effective
// For a quick solution without installing, you can use:
// const generateId = () => Math.random().toString(36).substr(2, 9);

const initialBookings: Booking[] = [
  {
    id: nanoid(),
    guestName: 'Alice Wonderland',
    guestContact: 'alice@example.com',
    roomNumber: 1,
    checkInDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    checkOutDate: new Date(new Date().setDate(new Date().getDate() + 3)),
    numberOfGuests: 2,
    totalAmount: 300,
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
    checkOutDate: new Date(new Date().setDate(new Date().getDate() + 5)),
    numberOfGuests: 1,
    totalAmount: 450,
    status: 'Confirmed',
    bookingSource: 'Phone',
    createdAt: new Date(),
  },
];


export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true); // Simulate async loading

  useEffect(() => {
    // Simulate fetching data
    const storedBookings = localStorage.getItem('homestayBookings');
    if (storedBookings) {
      setBookings(JSON.parse(storedBookings).map((b: Booking) => ({
        ...b,
        checkInDate: new Date(b.checkInDate),
        checkOutDate: new Date(b.checkOutDate),
        createdAt: new Date(b.createdAt),
        updatedAt: b.updatedAt ? new Date(b.updatedAt) : undefined,
      })));
    } else {
       // Map initial bookings to ensure Date objects are correct
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
    if (!loading) { // Only save when not initially loading
      localStorage.setItem('homestayBookings', JSON.stringify(bookings));
    }
  }, [bookings, loading]);

  const addBooking = useCallback((newBookingData: Omit<Booking, 'id' | 'createdAt'>) => {
    const bookingWithId: Booking = {
      ...newBookingData,
      id: nanoid(),
      createdAt: new Date(),
    };
    setBookings((prevBookings) => [...prevBookings, bookingWithId]);
    return bookingWithId;
  }, []);

  const updateBooking = useCallback((id: string, updatedBookingData: Partial<Omit<Booking, 'id' | 'createdAt'>>) => {
    setBookings((prevBookings) =>
      prevBookings.map((booking) =>
        booking.id === id
          ? { ...booking, ...updatedBookingData, updatedAt: new Date() }
          : booking
      )
    );
    const updatedBooking = bookings.find(b => b.id === id);
    return updatedBooking ? { ...updatedBooking, ...updatedBookingData, updatedAt: new Date() } : undefined;
  }, [bookings]);

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


import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Booking } from '@/lib/types';

const dataDirectory = path.join(process.cwd(), 'data');
const dataFilePath = path.join(dataDirectory, 'bookings.json');

async function ensureDataFileExists(): Promise<Booking[]> {
  try {
    await fs.access(dataDirectory);
  } catch {
    await fs.mkdir(dataDirectory, { recursive: true });
  }

  try {
    const fileData = await fs.readFile(dataFilePath, 'utf-8');
    return JSON.parse(fileData) as Booking[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      const initialBookings = getInitialBookingsForFile();
      await fs.writeFile(dataFilePath, JSON.stringify(initialBookings, null, 2), 'utf-8');
      return initialBookings;
    }
    console.error('Error reading or initializing bookings file:', error);
    throw error;
  }
}

const getInitialBookingsForFile = (): any[] => {
  const today = new Date();
  return [
    {
      id: 'init-alice-wonderland',
      guestName: 'Alice Wonderland',
      guestContact: 'alice@example.com',
      roomNumbers: [1], // Changed to roomNumbers
      checkInDate: new Date(new Date(today).setDate(today.getDate() + 1)).toISOString(),
      checkOutDate: new Date(new Date(today).setDate(today.getDate() + 3)).toISOString(),
      numberOfGuests: 2,
      pricePerNight: 150,
      totalAmount: 300, // 150 * 2 nights * 1 room
      status: 'Confirmed',
      bookingSource: 'Online',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'init-bob-builder',
      guestName: 'Bob The Builder',
      guestContact: 'bob@example.com',
      roomNumbers: [2, 3], // Changed to roomNumbers
      checkInDate: new Date(new Date(today).setDate(today.getDate() + 2)).toISOString(),
      checkOutDate: new Date(new Date(today).setDate(today.getDate() + 5)).toISOString(),
      numberOfGuests: 3,
      pricePerNight: 120,
      totalAmount: 720, // 120 * 3 nights * 2 rooms
      status: 'Confirmed',
      bookingSource: 'Phone',
      createdAt: new Date().toISOString(),
    },
  ];
};

export async function GET() {
  try {
    const bookings = await ensureDataFileExists();
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('GET /api/bookings - Failed to read bookings:', error);
    return NextResponse.json({ message: 'Failed to retrieve bookings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const bookingsPayload = await request.json(); 

    if (!Array.isArray(bookingsPayload)) {
      return NextResponse.json({ message: 'Invalid payload: Expected an array of bookings.' }, { status: 400 });
    }

    const bookingsToWrite = bookingsPayload.map(booking => ({
      ...booking,
      // Ensure roomNumbers is an array, provide default if missing from old data or malformed
      roomNumbers: Array.isArray(booking.roomNumbers) ? booking.roomNumbers : (typeof booking.roomNumber === 'number' ? [booking.roomNumber] : [1]),
      checkInDate: new Date(booking.checkInDate).toISOString(),
      checkOutDate: new Date(booking.checkOutDate).toISOString(),
      createdAt: new Date(booking.createdAt).toISOString(),
      updatedAt: booking.updatedAt ? new Date(booking.updatedAt).toISOString() : undefined,
    }));

    await ensureDataFileExists();
    await fs.writeFile(dataFilePath, JSON.stringify(bookingsToWrite, null, 2), 'utf-8');
    return NextResponse.json({ message: 'Bookings saved successfully' });
  } catch (error) {
    console.error('POST /api/bookings - Failed to save bookings:', error);
    return NextResponse.json({ message: 'Failed to save bookings' }, { status: 500 });
  }
}

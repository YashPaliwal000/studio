
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Booking } from '@/lib/types';

// Define the path to the data file
const dataDirectory = path.join(process.cwd(), 'data');
const dataFilePath = path.join(dataDirectory, 'bookings.json');

// Helper to ensure the data directory and file exist
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
      // File doesn't exist, create it with initial data
      const initialBookings = getInitialBookingsForFile();
      await fs.writeFile(dataFilePath, JSON.stringify(initialBookings, null, 2), 'utf-8');
      return initialBookings;
    }
    console.error('Error reading or initializing bookings file:', error);
    throw error; // Re-throw other errors
  }
}

// Static initial bookings for when the file is first created by the API
// Dates are ISO strings for JSON compatibility. IDs are static for this initial set.
const getInitialBookingsForFile = (): any[] => {
  const today = new Date();
  return [
    {
      id: 'init-alice-wonderland',
      guestName: 'Alice Wonderland',
      guestContact: 'alice@example.com',
      roomNumber: 1,
      checkInDate: new Date(new Date(today).setDate(today.getDate() + 1)).toISOString(),
      checkOutDate: new Date(new Date(today).setDate(today.getDate() + 3)).toISOString(),
      numberOfGuests: 2,
      pricePerNight: 150,
      totalAmount: 300,
      status: 'Confirmed',
      bookingSource: 'Online',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'init-bob-builder',
      guestName: 'Bob The Builder',
      guestContact: 'bob@example.com',
      roomNumber: 2,
      checkInDate: new Date(new Date(today).setDate(today.getDate() + 2)).toISOString(),
      checkOutDate: new Date(new Date(today).setDate(today.getDate() + 5)).toISOString(),
      numberOfGuests: 1,
      pricePerNight: 120,
      totalAmount: 360,
      status: 'Confirmed',
      bookingSource: 'Phone',
      createdAt: new Date().toISOString(),
    },
  ];
};

export async function GET() {
  try {
    const bookings = await ensureDataFileExists();
    // Deserialize dates if they are stored as ISO strings and need to be Date objects
    // However, for GET, sending ISO strings is fine as client will parse.
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('GET /api/bookings - Failed to read bookings:', error);
    return NextResponse.json({ message: 'Failed to retrieve bookings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const bookingsPayload = await request.json(); // Expects an array of bookings

    if (!Array.isArray(bookingsPayload)) {
      return NextResponse.json({ message: 'Invalid payload: Expected an array of bookings.' }, { status: 400 });
    }

    // Ensure all dates are ISO strings before writing if they are Date objects
    const bookingsToWrite = bookingsPayload.map(booking => ({
      ...booking,
      checkInDate: new Date(booking.checkInDate).toISOString(),
      checkOutDate: new Date(booking.checkOutDate).toISOString(),
      createdAt: new Date(booking.createdAt).toISOString(),
      updatedAt: booking.updatedAt ? new Date(booking.updatedAt).toISOString() : undefined,
    }));

    await ensureDataFileExists(); // Ensures directory is there
    await fs.writeFile(dataFilePath, JSON.stringify(bookingsToWrite, null, 2), 'utf-8');
    return NextResponse.json({ message: 'Bookings saved successfully' });
  } catch (error) {
    console.error('POST /api/bookings - Failed to save bookings:', error);
    return NextResponse.json({ message: 'Failed to save bookings' }, { status: 500 });
  }
}

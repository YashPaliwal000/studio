
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Booking } from '@/lib/types';

const dataFilePath = path.join(process.cwd(), 'data', 'bookings.json');

async function getBookingsFromFile(): Promise<Booking[]> {
  try {
    const fileData = await fs.readFile(dataFilePath, 'utf-8');
    return JSON.parse(fileData) as Booking[];
  } catch (error) {
    // If the file doesn't exist or is invalid, return an empty array or handle as needed
    console.error('Error reading bookings file for public invoice:', error);
    return [];
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const bookingId = params.id;

  if (!bookingId) {
    return NextResponse.json({ message: 'Booking ID is required' }, { status: 400 });
  }

  try {
    const bookings = await getBookingsFromFile();
    const booking = bookings.find(b => b.id === bookingId);

    if (booking) {
      // Ensure dates are in a consistent format if needed, though client should handle Date objects
      const bookingToSend = {
        ...booking,
        checkInDate: new Date(booking.checkInDate).toISOString(),
        checkOutDate: new Date(booking.checkOutDate).toISOString(),
        createdAt: new Date(booking.createdAt).toISOString(),
        updatedAt: booking.updatedAt ? new Date(booking.updatedAt).toISOString() : undefined,
      };
      return NextResponse.json(bookingToSend);
    } else {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`GET /api/public-booking/${bookingId} - Failed to retrieve booking:`, error);
    return NextResponse.json({ message: 'Failed to retrieve booking details' }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Booking, RoomPrice } from '@/lib/types';
import { ROOM_CONFIG } from '@/lib/constants';
import { differenceInDays } from 'date-fns';

const dataDirectory = path.join(process.cwd(), 'data');
const dataFilePath = path.join(dataDirectory, 'bookings.json');

const calculateNights = (checkIn: Date | string, checkOut: Date | string): number => {
  const nights = differenceInDays(new Date(checkOut), new Date(checkIn));
  return nights > 0 ? nights : 1;
};

async function ensureDataFileExists(): Promise<Booking[]> {
  try {
    await fs.access(dataDirectory);
  } catch {
    await fs.mkdir(dataDirectory, { recursive: true });
  }

  try {
    const fileData = await fs.readFile(dataFilePath, 'utf-8');
    const bookingsFromFile = JSON.parse(fileData) as any[];
    return bookingsFromFile.map(b => {
      if (!b.roomPrices && b.pricePerNight) { // Old data with pricePerNight
        const nights = calculateNights(b.checkInDate, b.checkOutDate);
        b.roomPrices = b.roomNumbers.map((rn: number) => ({
          roomNumber: rn,
          price: b.pricePerNight,
        }));
        b.totalAmount = b.roomPrices.reduce((sum: number, rp: RoomPrice) => sum + (rp.price * nights), 0);
        delete b.pricePerNight;
      } else if (!b.roomPrices) { // Fallback if no price info at all
         const nights = calculateNights(b.checkInDate, b.checkOutDate);
         b.roomPrices = b.roomNumbers.map((rn: number) => {
            const roomConfig = ROOM_CONFIG.find(rc => rc.id === rn);
            return {
                roomNumber: rn,
                price: roomConfig ? roomConfig.defaultPrice : 1500, 
            };
         });
         b.totalAmount = b.roomPrices.reduce((sum: number, rp: RoomPrice) => sum + (rp.price * nights), 0);
      }
      return b as Booking;
    });
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

const getInitialBookingsForFile = (): Booking[] => {
  const today = new Date();
  const bookingsRaw = [
    {
      id: 'init-alice-wonderland',
      guestName: 'Alice Wonderland',
      guestContact: 'alice@example.com',
      roomNumbers: [ROOM_CONFIG[0].id], // Use ID from ROOM_CONFIG
      checkInDate: new Date(new Date(today).setDate(today.getDate() + 1)).toISOString(),
      checkOutDate: new Date(new Date(today).setDate(today.getDate() + 3)).toISOString(),
      numberOfGuests: 2,
      roomPrices: [{ roomNumber: ROOM_CONFIG[0].id, price: ROOM_CONFIG[0].defaultPrice }],
      status: 'Confirmed',
      bookingSource: 'Online',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'init-bob-builder',
      guestName: 'Bob The Builder',
      guestContact: 'bob@example.com',
      roomNumbers: [ROOM_CONFIG[1].id, ROOM_CONFIG[2].id], // Use IDs
      checkInDate: new Date(new Date(today).setDate(today.getDate() + 2)).toISOString(),
      checkOutDate: new Date(new Date(today).setDate(today.getDate() + 5)).toISOString(),
      numberOfGuests: 3,
      roomPrices: [
        { roomNumber: ROOM_CONFIG[1].id, price: ROOM_CONFIG[1].defaultPrice },
        { roomNumber: ROOM_CONFIG[2].id, price: ROOM_CONFIG[2].defaultPrice },
      ],
      status: 'Confirmed',
      bookingSource: 'Phone',
      createdAt: new Date().toISOString(),
    },
  ];

  return bookingsRaw.map(b => {
    const nights = calculateNights(b.checkInDate, b.checkOutDate);
    const totalAmount = b.roomPrices.reduce((sum, rp) => sum + (rp.price * nights), 0);
    return { ...b, totalAmount } as Booking;
  });
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

    const bookingsToWrite = bookingsPayload.map(booking => {
      const { pricePerNight, ...bookingData } = booking as any; 
      
      if (!bookingData.roomPrices && pricePerNight) {
         const nights = calculateNights(bookingData.checkInDate, bookingData.checkOutDate);
         bookingData.roomPrices = bookingData.roomNumbers.map((rn: number) => ({
            roomNumber: rn,
            price: pricePerNight
         }));
         bookingData.totalAmount = bookingData.roomPrices.reduce((sum: number, rp: RoomPrice) => sum + (rp.price * nights), 0);
      } else if (!bookingData.roomPrices) { 
         const nights = calculateNights(bookingData.checkInDate, bookingData.checkOutDate);
         bookingData.roomPrices = bookingData.roomNumbers.map((rn: number) => {
            const roomConfig = ROOM_CONFIG.find(rc => rc.id === rn);
            return {
                roomNumber: rn,
                price: roomConfig ? roomConfig.defaultPrice : 1500,
            };
         });
         bookingData.totalAmount = bookingData.roomPrices.reduce((sum: number, rp: RoomPrice) => sum + (rp.price * nights), 0);
      }

      return {
      ...bookingData,
      roomNumbers: Array.isArray(bookingData.roomNumbers) ? bookingData.roomNumbers : (typeof bookingData.roomNumber === 'number' ? [bookingData.roomNumber] : [ROOM_CONFIG[0].id]),
      roomPrices: Array.isArray(bookingData.roomPrices) ? bookingData.roomPrices : [],
      checkInDate: new Date(bookingData.checkInDate).toISOString(),
      checkOutDate: new Date(bookingData.checkOutDate).toISOString(),
      createdAt: new Date(bookingData.createdAt).toISOString(),
      updatedAt: bookingData.updatedAt ? new Date(bookingData.updatedAt).toISOString() : undefined,
    }});

    try {
      await fs.access(dataDirectory);
    } catch {
      await fs.mkdir(dataDirectory, { recursive: true });
    }
    await fs.writeFile(dataFilePath, JSON.stringify(bookingsToWrite, null, 2), 'utf-8');
    return NextResponse.json({ message: 'Bookings saved successfully' });
  } catch (error) {
    console.error('POST /api/bookings - Failed to save bookings:', error);
    return NextResponse.json({ message: 'Failed to save bookings' }, { status: 500 });
  }
}

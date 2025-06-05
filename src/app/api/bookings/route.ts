
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Booking, RoomPrice, ExtraItem } from '@/lib/types';
import { ROOM_CONFIG } from '@/lib/constants';
import { differenceInDays } from 'date-fns';
import { nanoid } from 'nanoid';

const dataDirectory = path.join(process.cwd(), 'data');
const dataFilePath = path.join(dataDirectory, 'bookings.json');

const calculateNights = (checkIn: Date | string, checkOut: Date | string): number => {
  const nights = differenceInDays(new Date(checkOut), new Date(checkIn));
  return nights > 0 ? nights : 1;
};

const calculateGrossTotalAmount = (booking: Omit<Booking, 'totalAmount' | 'id' | 'createdAt' | 'updatedAt' | 'advancePayment' | 'discount'>): number => {
    const nights = calculateNights(booking.checkInDate, booking.checkOutDate);
    const roomTotal = booking.roomPrices.reduce((sum, rp) => sum + (rp.price * nights), 0);
    const extraItemsTotal = (booking.extraItems || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return roomTotal + extraItemsTotal;
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
      const nights = calculateNights(b.checkInDate, b.checkOutDate);
      
      if (!Array.isArray(b.roomPrices)) {
        if (b.pricePerNight && Array.isArray(b.roomNumbers)) { 
          b.roomPrices = b.roomNumbers.map((rn: number) => ({
            roomNumber: rn,
            price: b.pricePerNight,
          }));
        } else { 
           b.roomPrices = (b.roomNumbers || [ROOM_CONFIG[0].id]).map((rn: number) => {
              const roomConfig = ROOM_CONFIG.find(rc => rc.id === rn);
              return {
                  roomNumber: rn,
                  price: roomConfig ? roomConfig.defaultPrice : 1500, 
              };
           });
        }
        delete b.pricePerNight;
      }
      
      b.extraItems = (Array.isArray(b.extraItems) ? b.extraItems : []).map((ei: any) => ({
        ...ei,
        id: ei.id || nanoid() 
      }));

      const roomTotal = b.roomPrices.reduce((sum: number, rp: RoomPrice) => sum + (rp.price * nights), 0);
      const extraItemsTotal = b.extraItems.reduce((sum: number, item: ExtraItem) => sum + (item.price * item.quantity), 0);
      b.totalAmount = roomTotal + extraItemsTotal; // Gross total
      
      b.advancePayment = typeof b.advancePayment === 'number' ? b.advancePayment : 0;
      b.discount = typeof b.discount === 'number' ? b.discount : 0;
      
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
  const bookingsRaw: Array<Omit<Booking, 'totalAmount'>> = [
    {
      id: 'init-alice-wonderland',
      guestName: 'Alice Wonderland',
      guestContact: 'alice@example.com',
      roomNumbers: [ROOM_CONFIG[0].id], 
      checkInDate: new Date(new Date(today).setDate(today.getDate() + 1)),
      checkOutDate: new Date(new Date(today).setDate(today.getDate() + 3)),
      numberOfGuests: 2,
      roomPrices: [{ roomNumber: ROOM_CONFIG[0].id, price: ROOM_CONFIG[0].defaultPrice }],
      extraItems: [],
      advancePayment: 500,
      discount: 100,
      status: 'Confirmed',
      bookingSource: 'Online',
      createdAt: new Date(),
    },
    {
      id: 'init-bob-builder',
      guestName: 'Bob The Builder',
      guestContact: 'bob@example.com',
      roomNumbers: [ROOM_CONFIG[1].id, ROOM_CONFIG[2].id], 
      checkInDate: new Date(new Date(today).setDate(today.getDate() + 2)),
      checkOutDate: new Date(new Date(today).setDate(today.getDate() + 5)),
      numberOfGuests: 3,
      roomPrices: [
        { roomNumber: ROOM_CONFIG[1].id, price: ROOM_CONFIG[1].defaultPrice },
        { roomNumber: ROOM_CONFIG[2].id, price: ROOM_CONFIG[2].defaultPrice },
      ],
      extraItems: [
        { id: nanoid(), name: "Extra Breakfast", price: 250, quantity: 2, unit: "plate" }
      ],
      advancePayment: 0,
      discount: 0,
      status: 'Confirmed',
      bookingSource: 'Phone',
      createdAt: new Date(),
    },
  ];

  return bookingsRaw.map(b => {
    const totalAmount = calculateGrossTotalAmount(b); // Gross total
    return { 
        ...b, 
        totalAmount, 
        checkInDate: new Date(b.checkInDate).toISOString(), 
        checkOutDate: new Date(b.checkOutDate).toISOString(), 
        createdAt: new Date(b.createdAt).toISOString(),
        advancePayment: b.advancePayment || 0,
        discount: b.discount || 0,
    } as Booking;
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
      
      const nights = calculateNights(bookingData.checkInDate, bookingData.checkOutDate);
      
      let currentRoomPrices = Array.isArray(bookingData.roomPrices) ? bookingData.roomPrices : [];
      if (currentRoomPrices.length === 0 && pricePerNight) {
         currentRoomPrices = (bookingData.roomNumbers || [ROOM_CONFIG[0].id]).map((rn: number) => ({
            roomNumber: rn,
            price: pricePerNight
         }));
      } else if (currentRoomPrices.length === 0) {
         currentRoomPrices = (bookingData.roomNumbers || [ROOM_CONFIG[0].id]).map((rn: number) => {
            const roomConfig = ROOM_CONFIG.find(rc => rc.id === rn);
            return {
                roomNumber: rn,
                price: roomConfig ? roomConfig.defaultPrice : 1500,
            };
         });
      }

      const currentExtraItems = (Array.isArray(bookingData.extraItems) ? bookingData.extraItems : []).map((ei: any) => ({
        ...ei,
        id: ei.id || nanoid()
      }));

      const roomTotal = currentRoomPrices.reduce((sum: number, rp: RoomPrice) => sum + (rp.price * nights), 0);
      const extraItemsTotal = currentExtraItems.reduce((sum: number, item: ExtraItem) => sum + (item.price * item.quantity), 0);
      const calculatedGrossTotalAmount = roomTotal + extraItemsTotal;

      return {
        ...bookingData,
        roomNumbers: Array.isArray(bookingData.roomNumbers) ? bookingData.roomNumbers : (typeof bookingData.roomNumber === 'number' ? [bookingData.roomNumber] : [ROOM_CONFIG[0].id]),
        roomPrices: currentRoomPrices,
        extraItems: currentExtraItems,
        totalAmount: calculatedGrossTotalAmount, // Gross total
        advancePayment: typeof bookingData.advancePayment === 'number' ? bookingData.advancePayment : 0,
        discount: typeof bookingData.discount === 'number' ? bookingData.discount : 0,
        checkInDate: new Date(bookingData.checkInDate).toISOString(),
        checkOutDate: new Date(bookingData.checkOutDate).toISOString(),
        createdAt: new Date(bookingData.createdAt).toISOString(),
        updatedAt: bookingData.updatedAt ? new Date(bookingData.updatedAt).toISOString() : undefined,
      };
    });

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


'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Booking } from '@/lib/types';
import { ROOM_CONFIG } from '@/lib/constants';
import { BedDouble, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface RoomAvailabilityProps {
  selectedDate: Date;
  bookings: Booking[];
}

export default function RoomAvailability({ selectedDate, bookings }: RoomAvailabilityProps) {
  const getRoomStatus = (roomId: number) => {
    const bookingForRoom = bookings.find(
      (booking) =>
        booking.roomNumbers.includes(roomId) &&
        new Date(booking.checkInDate) <= selectedDate &&
        new Date(booking.checkOutDate) > selectedDate &&
        booking.status !== 'Cancelled'
    );
    return bookingForRoom ? { status: 'Booked', guestName: bookingForRoom.guestName } : { status: 'Available' };
  };

  const bookingsOnSelectedDate = bookings.filter(booking => 
    new Date(booking.checkInDate) <= selectedDate &&
    new Date(booking.checkOutDate) > selectedDate &&
    booking.status !== 'Cancelled'
  ).sort((a,b) => {
    const firstRoomA = ROOM_CONFIG.find(r => r.id === (a.roomNumbers[0] || 0))?.name || String(a.roomNumbers[0] || 0);
    const firstRoomB = ROOM_CONFIG.find(r => r.id === (b.roomNumbers[0] || 0))?.name || String(b.roomNumbers[0] || 0);
    return firstRoomA.localeCompare(firstRoomB);
  });

  const getRoomNameById = (roomId: number) => ROOM_CONFIG.find(r => r.id === roomId)?.name || `Room ${roomId}`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Room Status for {format(selectedDate, 'PPP')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {ROOM_CONFIG.map((room) => {
              const roomInfo = getRoomStatus(room.id);
              return (
                <li key={room.id} className="flex items-center justify-between p-3 rounded-md border">
                  <div className="flex items-center gap-2">
                    <BedDouble className={`h-5 w-5 ${roomInfo.status === 'Booked' ? 'text-destructive' : 'text-green-500'}`} />
                    <span className="font-medium">{room.name}</span>
                  </div>
                  {roomInfo.status === 'Booked' ? (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <XCircle className="h-4 w-4"/> Booked <span className="hidden sm:inline">- {roomInfo.guestName}</span>
                    </Badge>
                  ) : (
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600 flex items-center gap-1">
                     <CheckCircle2 className="h-4 w-4" /> Available
                    </Badge>
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Bookings on {format(selectedDate, 'PPP')}</CardTitle>
        </CardHeader>
        <CardContent>
          {bookingsOnSelectedDate.length > 0 ? (
            <ul className="space-y-3">
              {bookingsOnSelectedDate.map(booking => (
                <li key={booking.id} className="p-3 rounded-md border">
                  <p className="font-semibold text-primary">
                    Rooms {booking.roomNumbers.map(getRoomNameById).join(', ')}: {booking.guestName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Check-in: {format(new Date(booking.checkInDate), 'p')}, Check-out: {format(new Date(booking.checkOutDate), 'PPP p')}
                  </p>
                  <p className="text-sm text-muted-foreground">Status: {booking.status}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No active bookings for this date.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

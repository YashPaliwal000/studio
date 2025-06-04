
'use client';
import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Booking } from '@/lib/types';
import { ROOM_CONFIG } from '@/lib/constants';
import { Edit, Trash2, User, Phone, CalendarDays, BedDouble, Users, IndianRupee, CheckCircle, Info, PackageOpen, FileText } from 'lucide-react';

interface BookingCardProps {
  booking: Booking;
  onDelete: (id: string) => void;
}

const statusColors: { [key in Booking['status']]: string } = {
  Confirmed: 'bg-green-500 hover:bg-green-600',
  CheckedIn: 'bg-blue-500 hover:bg-blue-600',
  CheckedOut: 'bg-gray-500 hover:bg-gray-600',
  Cancelled: 'bg-red-500 hover:bg-red-600',
};

const getRoomNames = (roomIds: number[]): string => {
  return roomIds.map(id => {
    const room = ROOM_CONFIG.find(r => r.id === id);
    return room ? room.name : `Room ${id}`;
  }).join(', ');
};

export default function BookingCard({ booking, onDelete }: BookingCardProps) {
  const averagePricePerNight = booking.roomPrices.length > 0
    ? booking.roomPrices.reduce((sum, rp) => sum + rp.price, 0) / booking.roomPrices.length
    : 0;
  
  const roomNames = getRoomNames(booking.roomNumbers);

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow w-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="font-headline text-xl text-primary">{booking.guestName}</CardTitle>
            <CardDescription>Booking ID: {booking.id.substring(0, 8)}</CardDescription>
          </div>
          <Badge className={`${statusColors[booking.status]} text-white`}>{booking.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm flex-grow">
        <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> Guest Contact: {booking.guestContact}</div>
        <div className="flex items-center gap-2"><BedDouble className="h-4 w-4 text-muted-foreground" /> Rooms: {roomNames}</div>
        <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground" /> Check-in: {format(new Date(booking.checkInDate), 'PPP')}</div>
        <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground" /> Check-out: {format(new Date(booking.checkOutDate), 'PPP')}</div>
        <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> Guests: {booking.numberOfGuests}</div>
        <div className="flex items-center gap-2">
          <IndianRupee className="h-4 w-4 text-muted-foreground" />
          {booking.roomPrices.length > 1 ? `Avg. ₹${averagePricePerNight.toFixed(2)}/night | ` : (booking.roomPrices[0] ? `Price ₹${booking.roomPrices[0].price.toFixed(2)}/night | ` : '')}
          Total: ₹{booking.totalAmount.toFixed(2)}
        </div>
        {booking.bookingSource && <div className="flex items-center gap-2"><PackageOpen className="h-4 w-4 text-muted-foreground" /> Source: {booking.bookingSource}</div>}
        {booking.notes && <div className="flex items-start gap-2"><Info className="h-4 w-4 text-muted-foreground mt-1" /> Notes: <span className="italic">{booking.notes}</span></div>}
      </CardContent>
      <CardFooter className="flex justify-end gap-2 flex-wrap">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/bookings/${booking.id}/invoice`}>
            <FileText className="mr-1 h-4 w-4" /> Invoice
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/bookings/${booking.id}/edit`}>
            <Edit className="mr-1 h-4 w-4" /> Edit
          </Link>
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(booking.id)}>
          <Trash2 className="mr-1 h-4 w-4" /> Delete
        </Button>
      </CardFooter>
    </Card>
  );
}


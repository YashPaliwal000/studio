'use client';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Booking } from '@/lib/types';
import { User, CalendarDays, BedDouble, CheckCircle2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface CheckInItemProps {
  booking: Booking;
  onCheckIn: (id: string) => void;
}

export default function CheckInItem({ booking, onCheckIn }: CheckInItemProps) {
  const canCheckIn = booking.status === 'Confirmed';

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="font-headline text-lg text-primary">{booking.guestName}</CardTitle>
           <Badge variant={booking.status === 'CheckedIn' ? "default" : (booking.status === 'Confirmed' ? "secondary" : "outline")} 
                 className={booking.status === 'CheckedIn' ? 'bg-green-500 text-white' : ''}>
            {booking.status}
          </Badge>
        </div>
        <CardDescription>Room {booking.roomNumber}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> {booking.guestContact}</div>
        <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground" /> Check-in: {format(new Date(booking.checkInDate), 'PP')}</div>
        <div className="flex items-center gap-2"><BedDouble className="h-4 w-4 text-muted-foreground" /> {booking.numberOfGuests} Guest(s)</div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/bookings/${booking.id}/edit`}>
            <ExternalLink className="mr-1 h-3 w-3" /> View Details
          </Link>
        </Button>
        {canCheckIn && (
          <Button size="sm" onClick={() => onCheckIn(booking.id)} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <CheckCircle2 className="mr-1 h-4 w-4" /> Mark as Checked-In
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

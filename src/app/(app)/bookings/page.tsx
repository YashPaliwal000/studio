'use client';
import { useBookings } from '@/hooks/useBookings';
import BookingCard from '@/components/bookings/BookingCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useState }
from "react";

export default function BookingsPage() {
  const { bookings, deleteBooking, loading } = useBookings();
  const { toast } = useToast();
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);


  const handleDelete = (id: string) => {
    deleteBooking(id);
    toast({
      title: 'Booking Deleted',
      description: 'The booking has been successfully deleted.',
    });
    setBookingToDelete(null);
  };

  const confirmDelete = (id: string) => {
    setBookingToDelete(id);
  }

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-headline text-primary">All Bookings</h1>
        <Button asChild>
          <Link href="/bookings/add">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Booking
          </Link>
        </Button>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-xl text-muted-foreground mb-4">No bookings found.</p>
          <p className="text-muted-foreground">Get started by adding your first booking!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {bookings.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((booking) => (
            <BookingCard key={booking.id} booking={booking} onDelete={() => confirmDelete(booking.id)} />
          ))}
        </div>
      )}
       <AlertDialog open={!!bookingToDelete} onOpenChange={(open) => !open && setBookingToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the booking.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBookingToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => bookingToDelete && handleDelete(bookingToDelete)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="p-4 border rounded-lg shadow space-y-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="space-y-2 pt-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

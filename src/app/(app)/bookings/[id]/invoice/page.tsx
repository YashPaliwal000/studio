
'use client';
import { useParams, useRouter } from 'next/navigation';
import { useBookings } from '@/hooks/useBookings';
import InvoiceDetails from '@/components/invoice/InvoiceDetails';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/lib/constants';
import { useEffect, useState } from 'react';
import type { Booking } from '@/lib/types';
import { format as formatDate } from 'date-fns';

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getBookingById, loading: bookingsLoading } = useBookings();
  const [booking, setBooking] = useState<Booking | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [originalTitle, setOriginalTitle] = useState<string | null>(null);

  useEffect(() => {
    if (typeof document !== 'undefined' && !originalTitle) {
      setOriginalTitle(document.title);
    }
  }, [originalTitle]);

  useEffect(() => {
    if (bookingsLoading) {
      setLoading(true);
      return;
    }
    if (id) {
      const fetchedBooking = getBookingById(id as string);
      if (fetchedBooking) {
        setBooking(fetchedBooking);
        // Set document title for PDF saving
        const today = new Date();
        const formattedDate = formatDate(today, 'yyyy-MM-dd');
        const invoiceIdSuffix = fetchedBooking.id.substring(0, 8).toUpperCase();
        if (typeof document !== 'undefined') {
          document.title = `invoice_${formattedDate}_${invoiceIdSuffix}.pdf`;
        }
      } else {
        setError('Invoice not found. The booking may have been deleted or does not exist.');
      }
    }
    setLoading(false);

    // Cleanup: restore original title when component unmounts
    return () => {
      if (typeof document !== 'undefined' && originalTitle) {
        document.title = originalTitle;
      }
    };
  }, [id, getBookingById, bookingsLoading, originalTitle]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="max-w-3xl mx-auto bg-card p-6 sm:p-8 md:p-10 rounded-lg shadow-xl">
          <div className="flex justify-between items-start mb-8">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-6 w-1/4" />
          </div>
          <Skeleton className="h-6 w-1/2 mb-2" />
          <Skeleton className="h-4 w-1/3 mb-6" />
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div>
              <Skeleton className="h-5 w-1/4 mb-1" />
              <Skeleton className="h-4 w-3/4 mb-1" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="text-right">
              <Skeleton className="h-5 w-1/4 mb-1 ml-auto" />
              <Skeleton className="h-4 w-3/4 mb-1 ml-auto" />
              <Skeleton className="h-4 w-1/2 ml-auto" />
            </div>
          </div>
          
          <Skeleton className="h-8 w-full mb-4" /> {/* Table header */}
          {[1, 2].map(i => (
            <div key={i} className="flex justify-between py-2 border-b">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          ))}
          <div className="flex justify-end mt-4">
            <Skeleton className="h-6 w-1/3" />
          </div>
          <div className="mt-10 text-center">
            <Skeleton className="h-10 w-32 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 text-center">
        <p className="text-xl text-destructive mb-4">{error}</p>
        <Button onClick={() => router.push('/bookings')} className="mt-4">
          Go to Bookings
        </Button>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto py-12 text-center">
        <p className="text-xl text-muted-foreground">Booking data could not be loaded for the invoice.</p>
        <Button onClick={() => router.push('/bookings')} className="mt-4">
          Go to Bookings
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-2 sm:px-4 md:px-6 print:py-0">
      <InvoiceDetails booking={booking} appName={APP_NAME} />
    </div>
  );
}

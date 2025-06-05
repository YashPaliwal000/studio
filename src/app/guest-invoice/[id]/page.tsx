
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Booking } from '@/lib/types';
import { APP_NAME, ROOM_CONFIG } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format, differenceInDays } from 'date-fns';
import { Printer, AlertTriangle, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const getRoomName = (roomId: number): string => {
  const room = ROOM_CONFIG.find(r => r.id === roomId);
  return room ? room.name : `Room ${roomId}`;
};

export default function GuestInvoicePage() {
  const { id: bookingId } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [originalTitle, setOriginalTitle] = useState<string | null>(null);

  useEffect(() => {
    if (typeof document !== 'undefined' && !originalTitle) {
      setOriginalTitle(document.title);
    }
  }, [originalTitle]);

  useEffect(() => {
    if (bookingId) {
      const fetchBooking = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/public-booking/${bookingId}`);
          if (!response.ok) {
            if (response.status === 404) {
              throw new Error('Invoice not found. The link may be invalid or the booking has been removed.');
            }
            throw new Error('Failed to load invoice details.');
          }
          const data = await response.json();
          const parsedBooking: Booking = {
            ...data,
            checkInDate: new Date(data.checkInDate),
            checkOutDate: new Date(data.checkOutDate),
            createdAt: new Date(data.createdAt),
            updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
            advancePayment: data.advancePayment || 0,
            discount: data.discount || 0,
          };
          setBooking(parsedBooking);

          const today = new Date();
          const formattedDate = format(today, 'yyyy-MM-dd');
          const invoiceIdSuffix = parsedBooking.id.substring(0, 8).toUpperCase();
          if (typeof document !== 'undefined') {
            document.title = `invoice_${formattedDate}_${invoiceIdSuffix}.pdf`;
          }

        } catch (e: any) {
          setError(e.message);
        } finally {
          setLoading(false);
        }
      };
      fetchBooking();
    } else {
      setError('No booking ID provided.');
      setLoading(false);
    }
    return () => {
      if (typeof document !== 'undefined' && originalTitle) {
        document.title = originalTitle;
      }
    };
  }, [bookingId, originalTitle]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-3xl">
          <CardHeader className="bg-muted/30 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <Skeleton className="h-8 w-1/3 mb-2 sm:mb-0" />
              <div className="text-sm text-muted-foreground mt-2 sm:mt-0 sm:text-right space-y-1">
                <Skeleton className="h-4 w-32 ml-auto" />
                <Skeleton className="h-4 w-24 ml-auto" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 md:p-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div>
                <Skeleton className="h-5 w-1/4 mb-2" />
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="sm:text-right">
                <Skeleton className="h-5 w-1/4 mb-2 ml-auto" />
                <Skeleton className="h-4 w-3/4 mb-1 ml-auto" />
                <Skeleton className="h-4 w-2/3 mb-1 ml-auto" />
                <Skeleton className="h-4 w-1/2 ml-auto" />
              </div>
            </div>
             <Skeleton className="h-6 w-1/3 mb-3" />
            <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
             <div className="mt-6 flex justify-end">
                <Skeleton className="h-10 w-1/3" /> 
            </div>
          </CardContent>
          <CardFooter className="p-6 sm:p-8 md:p-10 flex justify-center">
            <Skeleton className="h-12 w-48" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-red-50/50 p-4 text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Invoice Error</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => router.push('/')} variant="outline">Go to Homepage</Button>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <p className="text-xl">Invoice data could not be loaded.</p>
      </div>
    );
  }

  const nights = differenceInDays(new Date(booking.checkOutDate), new Date(booking.checkInDate)) || 1;
  const discountAmount = booking.discount || 0;
  const advancePaymentAmount = booking.advancePayment || 0;
  const subtotalAfterDiscount = booking.totalAmount - discountAmount;
  const balanceDue = subtotalAfterDiscount - advancePaymentAmount;

  return (
    <div className="min-h-screen bg-background py-8 px-2 sm:px-4 md:px-6 print:py-0 print:bg-transparent">
      <Card className="max-w-3xl mx-auto shadow-xl print:shadow-none print:border-none print:bg-card">
        <CardHeader className="bg-muted/30 p-6 sm:p-8 print:bg-transparent">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-3xl font-bold text-primary font-headline">{APP_NAME}</h1>
              <p className="text-muted-foreground">Invoice</p>
            </div>
            <div className="text-sm text-muted-foreground mt-2 sm:mt-0 sm:text-right">
              <p><strong>Invoice ID:</strong> INV-{booking.id.substring(0, 8).toUpperCase()}</p>
              <p><strong>Date Issued:</strong> {format(new Date(), 'PPP')}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 md:p-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">Bill To:</h2>
              <p className="font-medium">{booking.guestName}</p>
              <p>{booking.guestContact}</p>
            </div>
            <div className="sm:text-right">
              <h2 className="text-lg font-semibold text-foreground mb-2">Booking Details:</h2>
              <p><strong>Rooms:</strong> {booking.roomNumbers.map(getRoomName).join(', ')}</p>
              <p><strong>Check-in:</strong> {format(new Date(booking.checkInDate), 'PPP')}</p>
              <p><strong>Check-out:</strong> {format(new Date(booking.checkOutDate), 'PPP')}</p>
              <p><strong>Guests:</strong> {booking.numberOfGuests}</p>
              <p><strong>Nights:</strong> {nights}</p>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-3 border-b pb-2">Order Summary</h3>
            <div className="flow-root">
              <div className="-mx-4 sm:-mx-6">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-muted">
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:pl-6">Description</th>
                        <th scope="col" className="hidden px-3 py-3.5 text-right text-sm font-semibold text-foreground sm:table-cell">Rate (Rs.)</th>
                        <th scope="col" className="hidden px-3 py-3.5 text-right text-sm font-semibold text-foreground sm:table-cell">Qty/Nights</th>
                        <th scope="col" className="py-3.5 pl-3 pr-4 text-right text-sm font-semibold text-foreground sm:pr-6">Amount (Rs.)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {booking.roomPrices.map((roomPrice, index) => (
                        <tr key={`room-${index}`} className="border-b border-muted">
                          <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <p className="font-medium text-foreground">{getRoomName(roomPrice.roomNumber)}</p>
                            <p className="text-muted-foreground">{format(new Date(booking.checkInDate), 'MMM d')} - {format(new Date(booking.checkOutDate), 'MMM d, yyyy')}</p>
                          </td>
                          <td className="hidden px-3 py-4 text-right text-sm text-muted-foreground sm:table-cell">
                            {roomPrice.price.toFixed(2)}
                          </td>
                          <td className="hidden px-3 py-4 text-right text-sm text-muted-foreground sm:table-cell">
                            {nights} night{nights > 1 ? 's' : ''}
                          </td>
                          <td className="py-4 pl-3 pr-4 text-right text-sm font-medium text-foreground sm:pr-6">
                            Rs. {(roomPrice.price * nights).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {booking.extraItems && booking.extraItems.length > 0 && (
                           <tr><td colSpan={4} className="pt-2 pb-1 pl-4 sm:pl-6"><p className="text-sm font-medium text-muted-foreground">Extra Items:</p></td></tr>
                      )}
                      {booking.extraItems?.map((item, index) => (
                        <tr key={`extra-${index}`} className="border-b border-muted">
                          <td className="py-2 pl-4 pr-3 text-sm sm:pl-6">
                            <p className="font-medium text-foreground">{item.name}</p>
                             <p className="text-muted-foreground text-xs">({item.unit})</p>
                          </td>
                          <td className="hidden px-3 py-2 text-right text-sm text-muted-foreground sm:table-cell">
                            {item.price.toFixed(2)}
                          </td>
                          <td className="hidden px-3 py-2 text-right text-sm text-muted-foreground sm:table-cell">
                            {item.quantity}
                          </td>
                          <td className="py-2 pl-3 pr-4 text-right text-sm font-medium text-foreground sm:pr-6">
                            Rs. {(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                     <tfoot>
                      <tr>
                        <th scope="row" colSpan={3} className="hidden pt-4 pl-6 pr-3 text-right text-sm font-normal text-muted-foreground sm:table-cell sm:pl-0">
                          Subtotal
                        </th>
                        <th scope="row" className="pt-4 pl-4 pr-3 text-left text-sm font-normal text-muted-foreground sm:hidden">
                          Subtotal
                        </th>
                        <td className="pt-4 pl-3 pr-4 text-right text-sm text-muted-foreground sm:pr-6">
                          Rs. {booking.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                      {discountAmount > 0 && (
                        <tr>
                          <th scope="row" colSpan={3} className="hidden pt-1 pl-6 pr-3 text-right text-sm font-normal text-muted-foreground sm:table-cell sm:pl-0">
                            Discount
                          </th>
                          <th scope="row" className="pt-1 pl-4 pr-3 text-left text-sm font-normal text-muted-foreground sm:hidden">
                            Discount
                          </th>
                          <td className="pt-1 pl-3 pr-4 text-right text-sm text-muted-foreground sm:pr-6">
                            - Rs. {discountAmount.toFixed(2)}
                          </td>
                        </tr>
                      )}
                       <tr>
                          <th scope="row" colSpan={3} className="hidden pt-1 pl-6 pr-3 text-right text-sm font-semibold text-foreground sm:table-cell sm:pl-0">
                            {discountAmount > 0 ? 'Total After Discount' : 'Total'}
                          </th>
                          <th scope="row" className="pt-1 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:hidden">
                            {discountAmount > 0 ? 'Total After Discount' : 'Total'}
                          </th>
                          <td className="pt-1 pl-3 pr-4 text-right text-sm font-semibold text-foreground sm:pr-6">
                            Rs. {subtotalAfterDiscount.toFixed(2)}
                          </td>
                        </tr>
                      {advancePaymentAmount > 0 && (
                        <tr>
                          <th scope="row" colSpan={3} className="hidden pt-1 pl-6 pr-3 text-right text-sm font-normal text-muted-foreground sm:table-cell sm:pl-0">
                            Advance Paid
                          </th>
                          <th scope="row" className="pt-1 pl-4 pr-3 text-left text-sm font-normal text-muted-foreground sm:hidden">
                            Advance Paid
                          </th>
                          <td className="pt-1 pl-3 pr-4 text-right text-sm text-muted-foreground sm:pr-6">
                            - Rs. {advancePaymentAmount.toFixed(2)}
                          </td>
                        </tr>
                      )}
                      <tr className="border-t border-primary/50">
                          <th scope="row" colSpan={3} className="hidden pt-2 pl-6 pr-3 text-right text-lg font-bold text-primary sm:table-cell sm:pl-0">
                            Balance Due
                          </th>
                          <th scope="row" className="pt-2 pl-4 pr-3 text-left text-lg font-bold text-primary sm:hidden">
                            Balance Due
                          </th>
                          <td className="pt-2 pl-3 pr-4 text-right text-lg font-bold text-primary sm:pr-6">
                            Rs. {balanceDue.toFixed(2)}
                          </td>
                        </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
          
          <Separator className="my-8 print:hidden" />

          <div className="text-sm text-muted-foreground print:mt-12">
            <p className="mb-1">Thank you for staying with us at {APP_NAME}!</p>
            {booking.bookingSource && <p>Booking Source: {booking.bookingSource}</p>}
            {booking.notes && <p className="mt-2">Notes: <em>{booking.notes}</em></p>}
          </div>
        </CardContent>
        <CardFooter className="p-6 sm:p-8 md:p-10 flex justify-center print:hidden">
          <Button onClick={handlePrint} size="lg">
            <Printer className="mr-2 h-5 w-5" />
            Print / Save as PDF
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

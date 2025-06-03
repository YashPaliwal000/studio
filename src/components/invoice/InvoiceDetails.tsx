
'use client';
import type { Booking } from '@/lib/types';
import { APP_NAME } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format, differenceInDays } from 'date-fns';
import { Printer, IndianRupee } from 'lucide-react';

interface InvoiceDetailsProps {
  booking: Booking;
  appName: string;
}

export default function InvoiceDetails({ booking, appName }: InvoiceDetailsProps) {
  const handlePrint = () => {
    window.print();
  };

  const nights = differenceInDays(new Date(booking.checkOutDate), new Date(booking.checkInDate));
  // Use booking.pricePerNight directly
  const displayPricePerNight = booking.pricePerNight > 0 ? booking.pricePerNight : (nights > 0 ? booking.totalAmount / nights : booking.totalAmount);


  return (
    <Card className="max-w-3xl mx-auto shadow-xl print:shadow-none print:border-none">
      <CardHeader className="bg-muted/30 p-6 sm:p-8 print:bg-transparent">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary font-headline">{appName}</h1>
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
            <p><strong>Room:</strong> {booking.roomNumber}</p>
            <p><strong>Check-in:</strong> {format(new Date(booking.checkInDate), 'PPP')}</p>
            <p><strong>Check-out:</strong> {format(new Date(booking.checkOutDate), 'PPP')}</p>
            <p><strong>Guests:</strong> {booking.numberOfGuests}</p>
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
                      <th scope="col" className="hidden px-3 py-3.5 text-right text-sm font-semibold text-foreground sm:table-cell">Nights</th>
                      <th scope="col" className="hidden px-3 py-3.5 text-right text-sm font-semibold text-foreground sm:table-cell">Price Per Night</th>
                      <th scope="col" className="py-3.5 pl-3 pr-4 text-right text-sm font-semibold text-foreground sm:pr-6">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-muted">
                      <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <p className="font-medium text-foreground">Stay at {appName} - Room {booking.roomNumber}</p>
                        <p className="text-muted-foreground">{format(new Date(booking.checkInDate), 'MMM d, yyyy')} - {format(new Date(booking.checkOutDate), 'MMM d, yyyy')}</p>
                      </td>
                      <td className="hidden px-3 py-4 text-right text-sm text-muted-foreground sm:table-cell">{nights > 0 ? nights : 1}</td>
                      <td className="hidden px-3 py-4 text-right text-sm text-muted-foreground sm:table-cell">
                        <span className="inline-flex items-center"><IndianRupee className="h-3.5 w-3.5 mr-0.5" />{displayPricePerNight.toFixed(2)}</span>
                      </td>
                      <td className="py-4 pl-3 pr-4 text-right text-sm font-medium text-foreground sm:pr-6">
                        <span className="inline-flex items-center"><IndianRupee className="h-3.5 w-3.5 mr-0.5" />{booking.totalAmount.toFixed(2)}</span>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <th scope="row" colSpan={3} className="hidden pt-4 pl-6 pr-3 text-right text-sm font-semibold text-foreground sm:table-cell sm:pl-0">
                        Total
                      </th>
                      <th scope="row" className="pt-4 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:hidden">
                        Total
                      </th>
                      <td className="pt-4 pl-3 pr-4 text-right text-sm font-semibold text-foreground sm:pr-6">
                         <span className="inline-flex items-center"><IndianRupee className="h-4 w-4 mr-0.5" />{booking.totalAmount.toFixed(2)}</span>
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
          <p className="mb-1">Thank you for staying with us at {appName}!</p>
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
  );
}

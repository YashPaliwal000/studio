
'use client';
import type { Booking, RoomPrice, ExtraItem } from '@/lib/types';
import { APP_NAME, ROOM_CONFIG } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format, differenceInDays } from 'date-fns';
import { Printer, Terminal } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


interface InvoiceDetailsProps {
  booking: Booking;
  appName: string;
}

const WhatsAppIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="mr-2"
  >
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.289.173-1.413z" />
  </svg>
);


const getRoomName = (roomId: number): string => {
  const room = ROOM_CONFIG.find(r => r.id === roomId);
  return room ? room.name : `Room ${roomId}`;
};

export default function InvoiceDetails({ booking, appName }: InvoiceDetailsProps) {
  const handlePrint = () => {
    window.print();
  };

  const nights = differenceInDays(new Date(booking.checkOutDate), new Date(booking.checkInDate)) || 1;

  const handleShareOnWhatsApp = () => {
    const invoiceLink = typeof window !== 'undefined' ? window.location.href : ''; 
    
    let message = `Invoice for ${booking.guestName} from ${appName}:\n\n`;
    message += `Booking ID: INV-${booking.id.substring(0, 8).toUpperCase()}\n`;
    message += `Check-in: ${format(new Date(booking.checkInDate), 'PPP')}\n`;
    message += `Check-out: ${format(new Date(booking.checkOutDate), 'PPP')}\n`;
    message += `Nights: ${nights}\n`;
    message += `Rooms: ${booking.roomNumbers.map(getRoomName).join(', ')}\n`;
    if (booking.extraItems && booking.extraItems.length > 0) {
        message += `Extra Items:\n`;
        booking.extraItems.forEach(item => {
            message += `  - ${item.name} (Qty: ${item.quantity}, Price: Rs.${(item.price * item.quantity).toFixed(2)})\n`;
        });
    }
    message += `Total Amount: Rs.${booking.totalAmount.toFixed(2)}\n\n`;
    message += `View details: ${invoiceLink}\n\n`;
    message += `(Please find the PDF invoice attached if saved, or use the link above to view.)`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const totalExtraItemsCost = booking.extraItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  const totalRoomCost = booking.totalAmount - totalExtraItemsCost;


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
                          {(roomPrice.price * nights).toFixed(2)}
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
                          {(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
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
                         Rs. {booking.totalAmount.toFixed(2)}
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
      <CardFooter className="p-6 sm:p-8 md:p-10 flex flex-col sm:flex-row justify-center gap-3 print:hidden">
        <Button onClick={handlePrint} size="lg">
          <Printer className="mr-2 h-5 w-5" />
          Print / Save as PDF
        </Button>
        <Button onClick={handleShareOnWhatsApp} size="lg" variant="outline" className="bg-green-500 hover:bg-green-600 text-white hover:text-white border-green-500 hover:border-green-600">
          <WhatsAppIcon />
          Share on WhatsApp
        </Button>
      </CardFooter>
    </Card>
  );
}


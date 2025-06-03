
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import type { Booking, BookingStatus, BookingSource } from '@/lib/types';
import { ROOM_NUMBERS, BOOKING_STATUSES, BOOKING_SOURCES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

// BookingFormValues will not include totalAmount, as it's calculated by parent
const bookingFormSchema = z.object({
  guestName: z.string().min(2, { message: 'Guest name must be at least 2 characters.' }),
  guestContact: z.string().min(5, { message: 'Guest contact is required.' }),
  roomNumber: z.coerce.number().min(1).max(ROOM_NUMBERS.length),
  checkInDate: z.date({ required_error: 'Check-in date is required.' }),
  checkOutDate: z.date({ required_error: 'Check-out date is required.' }),
  numberOfGuests: z.coerce.number().min(1, { message: 'At least one guest is required.' }),
  pricePerNight: z.coerce.number().positive({ message: 'Price per night must be positive.' }),
  status: z.enum(BOOKING_STATUSES),
  bookingSource: z.enum(BOOKING_SOURCES).optional(),
  notes: z.string().optional(),
}).refine(data => data.checkOutDate > data.checkInDate, {
  message: "Check-out date must be after check-in date.",
  path: ["checkOutDate"],
});

// This type is for the form's own data
export type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  initialData?: Partial<BookingFormValues & { checkInDate: Date, checkOutDate: Date}>; // For edit mode, pass values according to form schema
  onSubmit: (data: BookingFormValues) => Promise<any>; // Parent will handle calculating totalAmount
  isEditMode?: boolean;
}

export default function BookingForm({ initialData, onSubmit, isEditMode = false }: BookingFormProps) {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: initialData ? {
        ...initialData,
        // Ensure dates are Date objects if passed as strings from initialData source
        checkInDate: initialData.checkInDate ? new Date(initialData.checkInDate) : undefined,
        checkOutDate: initialData.checkOutDate ? new Date(initialData.checkOutDate) : undefined,
      } : {
      guestName: '',
      guestContact: '',
      roomNumber: ROOM_NUMBERS[0],
      numberOfGuests: 1,
      pricePerNight: 1500, // Default price per night
      status: 'Confirmed',
      notes: '',
    },
  });

  async function handleSubmit(data: BookingFormValues) {
    try {
      await onSubmit(data); // onSubmit prop now expects BookingFormValues
      toast({
        title: isEditMode ? 'Booking Updated' : 'Booking Created',
        description: `Booking for ${data.guestName} has been successfully ${isEditMode ? 'updated' : 'created'}.`,
      });
      router.push('/bookings');
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${isEditMode ? 'update' : 'create'} booking. Please try again. Error: ${error instanceof Error ? error.message : String(error)}`,
        variant: 'destructive',
      });
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">{isEditMode ? 'Edit Booking' : 'Add New Booking'}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="guestName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guest Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter guest's full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="guestContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guest Contact (Phone/Email)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter phone number or email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="roomNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Number</FormLabel>
                    <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a room" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROOM_NUMBERS.map(roomNum => (
                          <SelectItem key={roomNum} value={String(roomNum)}>
                            Room {roomNum}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numberOfGuests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Guests</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="checkInDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Check-in Date</FormLabel>
                    <DatePicker date={field.value} setDate={field.onChange} placeholder="Select check-in date" />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="checkOutDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Check-out Date</FormLabel>
                    <DatePicker 
                      date={field.value} 
                      setDate={field.onChange} 
                      placeholder="Select check-out date"
                      disabled={(date) => form.getValues("checkInDate") ? date <= form.getValues("checkInDate") : false}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
                control={form.control}
                name="pricePerNight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price Per Night (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 1500.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booking Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BOOKING_STATUSES.map(status => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bookingSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booking Source (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BOOKING_SOURCES.map(source => (
                          <SelectItem key={source} value={source}>
                            {source}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any special requests or notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full md:w-auto" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Booking')}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

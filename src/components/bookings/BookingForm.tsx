
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
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
import { Checkbox } from "@/components/ui/checkbox"
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
import type { Booking, BookingStatus, BookingSource, RoomPrice } from '@/lib/types';
import { ROOM_NUMBERS, BOOKING_STATUSES, BOOKING_SOURCES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { IndianRupee } from 'lucide-react';

const roomPriceDetailSchema = z.object({
  roomNumber: z.number(),
  price: z.coerce.number().positive({ message: 'Price for each room must be positive.' }),
});

const bookingFormSchema = z.object({
  guestName: z.string().min(2, { message: 'Guest name must be at least 2 characters.' }),
  guestContact: z.string().min(5, { message: 'Guest contact is required.' }),
  roomNumbers: z.array(z.coerce.number()).min(1, { message: 'At least one room must be selected.' }),
  checkInDate: z.date({ required_error: 'Check-in date is required.' }),
  checkOutDate: z.date({ required_error: 'Check-out date is required.' }),
  numberOfGuests: z.coerce.number().min(1, { message: 'At least one guest is required.' }),
  roomPriceDetails: z.array(roomPriceDetailSchema).min(1, { message: 'Price for selected rooms must be provided.' }),
  status: z.enum(BOOKING_STATUSES),
  bookingSource: z.enum(BOOKING_SOURCES).optional(),
  notes: z.string().optional(),
}).refine(data => data.checkOutDate > data.checkInDate, {
  message: "Check-out date must be after check-in date.",
  path: ["checkOutDate"],
}).refine(data => {
  const selectedRoomNumbers = new Set(data.roomNumbers);
  const pricedRoomNumbers = new Set(data.roomPriceDetails.map(rp => rp.roomNumber));
  return data.roomNumbers.length === data.roomPriceDetails.length &&
         Array.from(selectedRoomNumbers).every(rn => pricedRoomNumbers.has(rn));
}, {
  message: "Price must be set for all selected rooms.",
  path: ["roomPriceDetails"],
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  initialData?: Partial<BookingFormValues & { checkInDate: Date, checkOutDate: Date, roomPrices?: RoomPrice[] }>;
  onSubmit: (data: BookingFormValues) => Promise<any>;
  isEditMode?: boolean;
}

const DEFAULT_ROOM_PRICE = 1500;

export default function BookingForm({ initialData, onSubmit, isEditMode = false }: BookingFormProps) {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: initialData ? {
        ...initialData,
        checkInDate: initialData.checkInDate ? new Date(initialData.checkInDate) : undefined,
        checkOutDate: initialData.checkOutDate ? new Date(initialData.checkOutDate) : undefined,
        roomNumbers: initialData.roomNumbers || [],
        roomPriceDetails: initialData.roomPrices?.map(rp => ({ roomNumber: rp.roomNumber, price: rp.price })) ||
                          initialData.roomNumbers?.map(rn => ({ roomNumber: rn, price: (initialData as any).pricePerNight || DEFAULT_ROOM_PRICE })) || [],
      } : {
      guestName: '',
      guestContact: '',
      roomNumbers: [],
      numberOfGuests: 1,
      roomPriceDetails: [],
      status: 'Confirmed',
      notes: '',
    },
  });

  const { fields: roomPriceFields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "roomPriceDetails",
  });

  const selectedRoomNumbers = form.watch('roomNumbers');

  useEffect(() => {
    const currentRoomPriceNumbers = new Set(roomPriceFields.map(f => f.roomNumber));
    const newSelectedRoomNumbers = new Set(selectedRoomNumbers);

    // Add new fields for newly selected rooms
    newSelectedRoomNumbers.forEach(rn => {
      if (!currentRoomPriceNumbers.has(rn)) {
        append({ roomNumber: rn, price: DEFAULT_ROOM_PRICE });
      }
    });

    // Remove fields for deselected rooms
    const indicesToRemove: number[] = [];
    roomPriceFields.forEach((field, index) => {
      if (!newSelectedRoomNumbers.has(field.roomNumber)) {
        indicesToRemove.push(index);
      }
    });
    // Remove in reverse order to avoid index shifting issues
    for (let i = indicesToRemove.length - 1; i >= 0; i--) {
      remove(indicesToRemove[i]);
    }
  }, [selectedRoomNumbers, roomPriceFields, append, remove]);


  async function handleSubmit(data: BookingFormValues) {
    try {
      // The data already contains roomPriceDetails in the correct format for the form values
      // This will be transformed into roomPrices in the page.tsx before calling the hook
      await onSubmit(data);
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
            
            <FormField
              control={form.control}
              name="roomNumbers"
              render={() => (
                <FormItem>
                  <div className="mb-2">
                    <FormLabel className="text-base">Select Rooms</FormLabel>
                    <FormDescription>
                      Choose one or more rooms for this booking.
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {ROOM_NUMBERS.map((roomNum) => (
                    <FormField
                      key={roomNum}
                      control={form.control}
                      name="roomNumbers"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={roomNum}
                            className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-md hover:bg-muted/50"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(roomNum)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), roomNum])
                                    : field.onChange(
                                        (field.value || []).filter(
                                          (value) => value !== roomNum
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Room {roomNum}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedRoomNumbers && selectedRoomNumbers.length > 0 && (
              <div className="space-y-4">
                <FormLabel className="text-base">Room Prices (Per Night)</FormLabel>
                {roomPriceFields.map((field, index) => (
                   <FormField
                    key={field.id}
                    control={form.control}
                    name={`roomPriceDetails.${index}.price`}
                    render={({ field: priceField }) => (
                      <FormItem className="flex flex-row items-center gap-4 p-3 border rounded-md">
                        <FormLabel className="min-w-[80px]">Room {roomPriceFields[index].roomNumber}:</FormLabel>
                        <FormControl>
                           <div className="relative w-full">
                            <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              type="number"
                              placeholder={`Price for room ${roomPriceFields[index].roomNumber}`}
                              {...priceField}
                              className="pl-9"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                 <FormMessage>{form.formState.errors.roomPriceDetails?.message || form.formState.errors.roomPriceDetails?.root?.message}</FormMessage>
              </div>
            )}


            <FormField
              control={form.control}
              name="numberOfGuests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Number of Guests</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 2" {...field} />
                  </FormControl>
                  <FormDescription>Total guests across all selected rooms.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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

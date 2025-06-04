
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
import { ROOM_CONFIG, BOOKING_STATUSES, BOOKING_SOURCES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { InfoIcon } from 'lucide-react';
import { useBookings } from '@/hooks/useBookings';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const roomPriceDetailSchema = z.object({
  roomNumber: z.number(), // This refers to room ID
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
  initialData?: Partial<BookingFormValues & { checkInDate: Date, checkOutDate: Date, roomPrices?: RoomPrice[], id?: string }>;
  onSubmit: (data: BookingFormValues) => Promise<any>;
  isEditMode?: boolean;
  currentBookingId?: string;
}

export default function BookingForm({ initialData, onSubmit, isEditMode = false, currentBookingId }: BookingFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { bookings: allBookings, loading: bookingsLoading } = useBookings();

  const getDefaultPriceForRoom = (roomId: number) => {
    const room = ROOM_CONFIG.find(r => r.id === roomId);
    return room ? room.defaultPrice : 1500; // Fallback, though should always find
  };

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: initialData ? {
        ...initialData,
        checkInDate: initialData.checkInDate ? new Date(initialData.checkInDate) : undefined,
        checkOutDate: initialData.checkOutDate ? new Date(initialData.checkOutDate) : undefined,
        roomNumbers: initialData.roomNumbers || [],
        roomPriceDetails: initialData.roomPrices?.map(rp => ({ roomNumber: rp.roomNumber, price: rp.price })) ||
                          initialData.roomNumbers?.map(rn => ({ roomNumber: rn, price: getDefaultPriceForRoom(rn) })) || [],
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

  const selectedRoomNumbersInForm = form.watch('roomNumbers');
  const checkInDate = form.watch('checkInDate');
  const checkOutDate = form.watch('checkOutDate');

  const conflictingRooms = useMemo(() => {
    if (!checkInDate || !checkOutDate || bookingsLoading || !allBookings) return new Set<number>();
    const conflicts = new Set<number>();

    for (const booking of allBookings) {
      if (currentBookingId && booking.id === currentBookingId) continue; 
      if (booking.status === 'Cancelled') continue;

      const existingCheckIn = new Date(booking.checkInDate);
      const existingCheckOut = new Date(booking.checkOutDate);

      if (checkInDate < existingCheckOut && checkOutDate > existingCheckIn) {
        booking.roomNumbers.forEach(rn => conflicts.add(rn));
      }
    }
    return conflicts;
  }, [allBookings, bookingsLoading, checkInDate, checkOutDate, currentBookingId]);


  useEffect(() => {
    if (bookingsLoading || !allBookings || !checkInDate || !checkOutDate) return;

    const currentlySelectedRooms = form.getValues('roomNumbers') || [];
    const stillAvailableSelectedRooms = currentlySelectedRooms.filter(roomNum => !conflictingRooms.has(roomNum));

    if (stillAvailableSelectedRooms.length < currentlySelectedRooms.length) {
      form.setValue('roomNumbers', stillAvailableSelectedRooms, { shouldValidate: true });
      toast({
          title: "Room Availability Update",
          description: "Some selected rooms became unavailable for the chosen dates and were automatically deselected.",
          variant: "default",
      });
    }
  }, [conflictingRooms, allBookings, bookingsLoading, checkInDate, checkOutDate, form, toast]);


  useEffect(() => {
    const currentRoomPriceNumbers = new Set(roomPriceFields.map(f => f.roomNumber));
    const newSelectedRoomNumbersSet = new Set(selectedRoomNumbersInForm);

    newSelectedRoomNumbersSet.forEach(rn => {
      if (!currentRoomPriceNumbers.has(rn)) {
        append({ roomNumber: rn, price: getDefaultPriceForRoom(rn) });
      }
    });

    const indicesToRemove: number[] = [];
    roomPriceFields.forEach((field, index) => {
      if (!newSelectedRoomNumbersSet.has(field.roomNumber)) {
        indicesToRemove.push(index);
      }
    });
    for (let i = indicesToRemove.length - 1; i >= 0; i--) {
      remove(indicesToRemove[i]);
    }
  }, [selectedRoomNumbersInForm, roomPriceFields, append, remove]);


  async function handleSubmit(data: BookingFormValues) {
    try {
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
      <TooltipProvider>
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
                      Choose one or more rooms. Unavailable rooms for selected dates are disabled.
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ROOM_CONFIG.map((room) => {
                    const isRoomConflicting = conflictingRooms.has(room.id);
                    return (
                      <FormField
                        key={room.id}
                        control={form.control}
                        name="roomNumbers"
                        render={({ field }) => {
                          return (
                            <Tooltip delayDuration={300}>
                              <TooltipTrigger asChild>
                                <FormItem
                                  className={cn(
                                    "flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-md hover:bg-muted/50",
                                    isRoomConflicting && "bg-destructive/10 border-destructive/30 cursor-not-allowed opacity-70"
                                  )}
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(room.id)}
                                      onCheckedChange={(checked) => {
                                        if (isRoomConflicting && checked) return; 
                                        return checked
                                          ? field.onChange([...(field.value || []), room.id])
                                          : field.onChange(
                                              (field.value || []).filter(
                                                (value) => value !== room.id
                                              )
                                            )
                                      }}
                                      disabled={isRoomConflicting}
                                      aria-disabled={isRoomConflicting}
                                    />
                                  </FormControl>
                                  <FormLabel className={cn("font-normal", isRoomConflicting && "cursor-not-allowed")}>
                                    {room.name} ({'\u20B9'}{room.defaultPrice})
                                  </FormLabel>
                                </FormItem>
                              </TooltipTrigger>
                              {isRoomConflicting && (
                                <TooltipContent side="bottom">
                                  <p className="flex items-center gap-1"><InfoIcon className="h-4 w-4" /> {room.name} is booked for these dates.</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          );
                        }}
                      />
                    );
                  })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedRoomNumbersInForm && selectedRoomNumbersInForm.length > 0 && (
              <div className="space-y-4">
                <FormLabel className="text-base">Room Prices (Per Night)</FormLabel>
                {roomPriceFields.map((field, index) => {
                  const roomDetails = ROOM_CONFIG.find(r => r.id === field.roomNumber);
                  return (
                   <FormField
                    key={field.id}
                    control={form.control}
                    name={`roomPriceDetails.${index}.price`}
                    render={({ field: priceField }) => (
                      <FormItem className="flex flex-row items-center gap-4 p-3 border rounded-md">
                        <FormLabel className="min-w-[120px] sm:min-w-[150px]">{roomDetails?.name || `Room ${field.roomNumber}`}:</FormLabel>
                        <FormControl>
                           <div className="relative w-full">
                            <span className="absolute left-3 top-1/2 h-full flex items-center text-muted-foreground text-sm pointer-events-none">{'\u20B9'}</span>
                            <Input
                              type="number"
                              placeholder={`Price for ${roomDetails?.name || `Room ${field.roomNumber}`}`}
                              {...priceField}
                              className="pl-7" 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  );
                })}
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
            <Button type="submit" className="w-full md:w-auto" disabled={form.formState.isSubmitting || bookingsLoading}>
              {bookingsLoading ? 'Checking availability...' : (form.formState.isSubmitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Booking'))}
            </Button>
          </CardFooter>
        </form>
      </Form>
      </TooltipProvider>
    </Card>
  );
}


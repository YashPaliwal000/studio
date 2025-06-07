
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
import type { Booking, BookingStatus, BookingSource, RoomPrice, ExtraItem } from '@/lib/types';
import { ROOM_CONFIG, BOOKING_STATUSES, BOOKING_SOURCES, FULL_HOME_STAY_PRICE_PER_NIGHT } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { InfoIcon, PlusCircle, Trash2, CircleDollarSign, Home } from 'lucide-react';
import { useBookings } from '@/hooks/useBookings';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { nanoid } from 'nanoid';
import { Separator } from '../ui/separator';
import { differenceInDays } from 'date-fns';


const roomPriceDetailSchema = z.object({
  roomNumber: z.number(), // This refers to room ID
  price: z.coerce.number().positive({ message: 'Price for each room must be positive.' }),
});

const extraItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, { message: "Item name is required."}),
  price: z.coerce.number().min(0, { message: "Item price cannot be negative."}),
  quantity: z.coerce.number().min(1, { message: "Item quantity must be at least 1."}),
  unit: z.string().min(1, { message: "Item unit is required (e.g., 'piece', 'plate')."}),
});

const bookingFormSchema = z.object({
  guestName: z.string().min(2, { message: 'Guest name must be at least 2 characters.' }),
  guestContact: z.string().min(5, { message: 'Guest contact is required.' }),
  roomNumbers: z.array(z.coerce.number()).min(1, { message: 'At least one room must be selected.' }),
  checkInDate: z.date({ required_error: 'Check-in date is required.' }),
  checkOutDate: z.date({ required_error: 'Check-out date is required.' }),
  numberOfGuests: z.coerce.number().min(1, { message: 'At least one guest is required.' }),
  roomPriceDetails: z.array(roomPriceDetailSchema).min(1, { message: 'Price for selected rooms must be provided.' }),
  extraItems: z.array(extraItemSchema).optional(),
  advancePayment: z.coerce.number().min(0, { message: "Advance payment cannot be negative."}).optional(),
  discount: z.coerce.number().min(0, { message: "Discount cannot be negative."}).optional(),
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
  initialData?: Partial<BookingFormValues & { checkInDate: Date, checkOutDate: Date, roomPrices?: RoomPrice[], id?: string, extraItems?: ExtraItem[] }>;
  onSubmit: (data: BookingFormValues) => Promise<any>;
  isEditMode?: boolean;
  currentBookingId?: string;
}

export default function BookingForm({ initialData, onSubmit, isEditMode = false, currentBookingId }: BookingFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { bookings: allBookings, loading: bookingsLoading } = useBookings();
  const [calculatedTotalAmount, setCalculatedTotalAmount] = useState(0);
  const [balanceDue, setBalanceDue] = useState(0);
  const [isFullHomeStaySelected, setIsFullHomeStaySelected] = useState(false);

  const getDefaultPriceForRoom = (roomId: number) => {
    const room = ROOM_CONFIG.find(r => r.id === roomId);
    return room ? room.defaultPrice : 1500;
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
        extraItems: initialData.extraItems?.map(ei => ({ ...ei, id: ei.id || nanoid() })) || [],
        advancePayment: initialData.advancePayment || 0,
        discount: initialData.discount || 0,
      } : {
      guestName: '',
      guestContact: '',
      roomNumbers: [],
      numberOfGuests: 1,
      roomPriceDetails: [],
      extraItems: [],
      advancePayment: 0,
      discount: 0,
      status: 'Confirmed',
      notes: '',
    },
  });
   
  useEffect(() => {
    if (initialData?.roomNumbers && initialData.roomNumbers.length === ROOM_CONFIG.length) {
      const expectedPackagePricePerRoom = ROOM_CONFIG.length > 0 ? FULL_HOME_STAY_PRICE_PER_NIGHT / ROOM_CONFIG.length : 0;
      const isLikelyFullHomeStay = initialData.roomPrices?.every(rp => Math.abs(rp.price - expectedPackagePricePerRoom) < 0.01);
      if (isLikelyFullHomeStay) {
        setIsFullHomeStaySelected(true);
      }
    }
  }, [initialData]);


  const { fields: roomPriceFields, append: appendRoomPrice, remove: removeRoomPrice, replace: replaceRoomPrices } = useFieldArray({
    control: form.control,
    name: "roomPriceDetails",
  });

  const { fields: extraItemFields, append: appendExtraItem, remove: removeExtraItem } = useFieldArray({
    control: form.control,
    name: "extraItems",
  });

  // Watched values
  const watchedCheckInDate = form.watch('checkInDate');
  const watchedCheckOutDate = form.watch('checkOutDate');
  const watchedRoomPriceDetails = form.watch('roomPriceDetails');
  const watchedExtraItems = form.watch('extraItems');
  const watchedAdvancePayment = form.watch('advancePayment');
  const watchedDiscount = form.watch('discount');
  const watchedRoomNumbers = form.watch('roomNumbers'); // For direct use in effects if stable reference is needed

  // For use in dependency arrays to ensure effect runs only on actual content change
  const roomNumbersDep = JSON.stringify(watchedRoomNumbers || []);


  useEffect(() => {
    if (!watchedCheckInDate || !watchedCheckOutDate) {
      setCalculatedTotalAmount(0);
      return;
    }
    let nights = differenceInDays(watchedCheckOutDate, watchedCheckInDate);
    if (nights <= 0) nights = 1;

    let totalRoomAmount = 0;
    if (isFullHomeStaySelected) {
        totalRoomAmount = FULL_HOME_STAY_PRICE_PER_NIGHT * nights;
    } else {
        totalRoomAmount = watchedRoomPriceDetails.reduce((sum, room) => {
            return sum + (room.price * nights);
        }, 0);
    }
    
    const totalExtraItemsAmount = (watchedExtraItems || []).reduce((sum, item) => {
        return sum + (item.price * item.quantity);
    }, 0);
    
    setCalculatedTotalAmount(totalRoomAmount + totalExtraItemsAmount);

  }, [watchedCheckInDate, watchedCheckOutDate, watchedRoomPriceDetails, watchedExtraItems, isFullHomeStaySelected]);

  useEffect(() => {
    const currentDiscount = watchedDiscount || 0;
    const currentAdvance = watchedAdvancePayment || 0;
    setBalanceDue(calculatedTotalAmount - currentDiscount - currentAdvance);
  }, [calculatedTotalAmount, watchedDiscount, watchedAdvancePayment]);


  const conflictingRooms = useMemo(() => {
    if (!watchedCheckInDate || !watchedCheckOutDate || bookingsLoading || !allBookings) return new Set<number>();
    const conflicts = new Set<number>();

    for (const booking of allBookings) {
      if (currentBookingId && booking.id === currentBookingId) continue; 
      if (booking.status === 'Cancelled') continue;

      const existingCheckIn = new Date(booking.checkInDate);
      const existingCheckOut = new Date(booking.checkOutDate);

      if (watchedCheckInDate < existingCheckOut && watchedCheckOutDate > existingCheckIn) {
        booking.roomNumbers.forEach(rn => conflicts.add(rn));
      }
    }
    return conflicts;
  }, [allBookings, bookingsLoading, watchedCheckInDate, watchedCheckOutDate, currentBookingId]);


  useEffect(() => {
    if (bookingsLoading || !allBookings || !watchedCheckInDate || !watchedCheckOutDate) return;

    if (isFullHomeStaySelected) {
        const anyRoomConflicting = ROOM_CONFIG.some(room => conflictingRooms.has(room.id));
        if (anyRoomConflicting) {
            setIsFullHomeStaySelected(false); 
            form.setValue('roomNumbers', [], { shouldValidate: true }); 
             toast({
                title: "Full Home Stay Unavailable",
                description: "One or more rooms are booked for the selected dates. Full Home Stay option cannot be selected.",
                variant: "destructive",
            });
            return;
        }
    } else {
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
    }
  }, [conflictingRooms, allBookings, bookingsLoading, watchedCheckInDate, watchedCheckOutDate, form, toast, isFullHomeStaySelected]);


  useEffect(() => {
    const currentPriceDetailsInForm = form.getValues('roomPriceDetails') || [];
    // Get current actual room numbers from form for logic, not from watch for dep array directly
    const localSelectedRoomNumbers = form.getValues('roomNumbers') || []; 

    let newTargetPriceDetails: Array<{ roomNumber: number; price: number }> = [];

    if (isFullHomeStaySelected) {
        const allRoomIds = ROOM_CONFIG.map(r => r.id);
        const pricePerRoomPackage = ROOM_CONFIG.length > 0 ? FULL_HOME_STAY_PRICE_PER_NIGHT / ROOM_CONFIG.length : 0;
        newTargetPriceDetails = allRoomIds.map(id => ({ roomNumber: id, price: pricePerRoomPackage }));
    } else {
        newTargetPriceDetails = localSelectedRoomNumbers.map(rn => {
            const existing = currentPriceDetailsInForm.find(p => p.roomNumber === rn);
            return existing || { roomNumber: rn, price: getDefaultPriceForRoom(rn) };
        });
    }

    const currentComparable = [...currentPriceDetailsInForm].sort((a,b) => a.roomNumber - b.roomNumber).map(p => `${p.roomNumber}:${p.price}`).join(',');
    const newComparable = [...newTargetPriceDetails].sort((a,b) => a.roomNumber - b.roomNumber).map(p => `${p.roomNumber}:${p.price}`).join(',');

    if (currentComparable !== newComparable) {
        replaceRoomPrices(newTargetPriceDetails);
    }
  // Use roomNumbersDep (JSON.stringify of watchedRoomNumbers) for stable dependency
  // replaceRoomPrices is stable. isFullHomeStaySelected is a primitive state.
  }, [roomNumbersDep, isFullHomeStaySelected, replaceRoomPrices, form]);


  const handleFullHomeStayToggle = (checked: boolean) => {
    setIsFullHomeStaySelected(checked);
    if (checked) {
        const allRoomIds = ROOM_CONFIG.map(r => r.id);
        form.setValue('roomNumbers', allRoomIds, { shouldValidate: true });
    } else {
        form.setValue('roomNumbers', [], { shouldValidate: true }); 
    }
  };

  async function handleSubmit(data: BookingFormValues) {
    try {
      let dataToSubmit = {...data};
      if (isFullHomeStaySelected && ROOM_CONFIG.length > 0) {
        const pricePerRoomPackage = FULL_HOME_STAY_PRICE_PER_NIGHT / ROOM_CONFIG.length;
        dataToSubmit.roomPriceDetails = ROOM_CONFIG.map(r => ({ roomNumber: r.id, price: pricePerRoomPackage }));
      }

      await onSubmit(dataToSubmit);
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
  
  const isAnyRoomConflictingForFullStay = ROOM_CONFIG.some(room => conflictingRooms.has(room.id));


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
            
            <div className="space-y-3">
                 <div className="flex items-center space-x-3 p-3 border rounded-md bg-primary/10 hover:bg-primary/20">
                    <Checkbox
                        id="fullHomeStay"
                        checked={isFullHomeStaySelected}
                        onCheckedChange={handleFullHomeStayToggle}
                        disabled={isAnyRoomConflictingForFullStay || bookingsLoading}
                        aria-disabled={isAnyRoomConflictingForFullStay || bookingsLoading}
                    />
                    <label
                        htmlFor="fullHomeStay"
                        className={cn(
                            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2",
                            (isAnyRoomConflictingForFullStay || bookingsLoading) && "cursor-not-allowed opacity-70"
                        )}
                    >
                        <Home className="h-5 w-5 text-primary"/> Book Full Home Stay (All Rooms @ Rs. {FULL_HOME_STAY_PRICE_PER_NIGHT}/night)
                    </label>
                    {isAnyRoomConflictingForFullStay && (
                        <Tooltip delayDuration={100}>
                            <TooltipTrigger asChild><InfoIcon className="h-4 w-4 text-destructive"/></TooltipTrigger>
                            <TooltipContent><p>One or more rooms unavailable for selected dates.</p></TooltipContent>
                        </Tooltip>
                    )}
                </div>
                 <Separator/>
            </div>

            <FormField
              control={form.control}
              name="roomNumbers"
              render={() => (
                <FormItem>
                  <div className="mb-2">
                    <FormLabel className="text-base">Select Rooms</FormLabel>
                    <FormDescription>
                      {isFullHomeStaySelected 
                        ? "All rooms are selected as part of Full Home Stay." 
                        : "Choose one or more rooms. Unavailable rooms for selected dates are disabled."}
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
                                    (isRoomConflicting || isFullHomeStaySelected) && "bg-muted/30 border-border/30 cursor-not-allowed opacity-70"
                                  )}
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(room.id)}
                                      onCheckedChange={(checked) => {
                                        if ((isRoomConflicting || isFullHomeStaySelected) && checked) return; 
                                        return checked
                                          ? field.onChange([...(field.value || []), room.id])
                                          : field.onChange(
                                              (field.value || []).filter(
                                                (value) => value !== room.id
                                              )
                                            )
                                      }}
                                      disabled={isRoomConflicting || isFullHomeStaySelected}
                                      aria-disabled={isRoomConflicting || isFullHomeStaySelected}
                                    />
                                  </FormControl>
                                  <FormLabel className={cn("font-normal", (isRoomConflicting || isFullHomeStaySelected) && "cursor-not-allowed")}>
                                    {room.name} (Rs. {room.defaultPrice})
                                  </FormLabel>
                                </FormItem>
                              </TooltipTrigger>
                              {isRoomConflicting && !isFullHomeStaySelected && (
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

            {watchedRoomNumbers && watchedRoomNumbers.length > 0 && (
              <div className="space-y-4">
                <FormLabel className="text-base">
                    {isFullHomeStaySelected ? "Room Prices (Package Distribution)" : "Room Prices (Per Night)"}
                </FormLabel>
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
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">Rs.</span>
                            <Input
                              type="number"
                              placeholder={`Price for ${roomDetails?.name || `Room ${field.roomNumber}`}`}
                              {...priceField}
                              className="pl-10" 
                              readOnly={isFullHomeStaySelected}
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

            <Separator />
            
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium">Extra Billable Items</h3>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendExtraItem({ id: nanoid(), name: '', price: 0, quantity: 1, unit: 'piece' })}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                    </Button>
                </div>
                {extraItemFields.length === 0 && <p className="text-sm text-muted-foreground">No extra items added.</p>}
                <div className="space-y-4">
                {extraItemFields.map((item, index) => (
                    <div key={item.id} className="p-4 border rounded-md space-y-3 bg-muted/20">
                       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
                            <FormField
                                control={form.control}
                                name={`extraItems.${index}.name`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Item Name</FormLabel>
                                    <FormControl><Input placeholder="e.g., Tea" {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`extraItems.${index}.quantity`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Quantity</FormLabel>
                                    <FormControl><Input type="number" placeholder="e.g., 2" {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name={`extraItems.${index}.unit`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Unit</FormLabel>
                                    <FormControl><Input placeholder="e.g., plate, piece" {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`extraItems.${index}.price`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Price (per unit)</FormLabel>
                                     <FormControl>
                                        <div className="relative w-full">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">Rs.</span>
                                            <Input type="number" placeholder="e.g., 50" {...field} className="pl-10" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeExtraItem(index)}
                            className="mt-2"
                        >
                            <Trash2 className="mr-1 h-4 w-4" /> Remove Item
                        </Button>
                    </div>
                ))}
                </div>
                <FormMessage>{form.formState.errors.extraItems?.message || form.formState.errors.extraItems?.root?.message}</FormMessage>
            </div>
            
            <Separator />

            <div className="space-y-4 p-4 border rounded-md bg-muted/20">
                <h3 className="text-lg font-medium flex items-center gap-2"><CircleDollarSign className="h-5 w-5 text-primary" />Payment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="discount"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Discount</FormLabel>
                            <FormControl>
                                <div className="relative w-full">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">Rs.</span>
                                <Input type="number" placeholder="Enter discount amount" {...field} className="pl-10" />
                                </div>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="advancePayment"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Advance Payment Received</FormLabel>
                            <FormControl>
                                <div className="relative w-full">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">Rs.</span>
                                <Input type="number" placeholder="Enter advance payment" {...field} className="pl-10" />
                                </div>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <Separator className="my-3 bg-border/70"/>
                 <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-muted-foreground">Calculated Gross Total:</p>
                        <p className="font-semibold text-lg">Rs. {calculatedTotalAmount.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-muted-foreground">Balance Due:</p>
                        <p className="font-bold text-xl text-primary">Rs. {balanceDue.toFixed(2)}</p>
                    </div>
                </div>
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



export type BookingStatus = 'Confirmed' | 'CheckedIn' | 'CheckedOut' | 'Cancelled';
export type BookingSource = 'Online' | 'Walk-in' | 'Phone' | 'Other';

export interface Booking {
  id: string;
  guestName: string;
  guestContact: string;
  roomNumber: number;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  totalAmount: number;
  status: BookingStatus;
  bookingSource?: BookingSource;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Room {
  id: number;
  name: string;
  // Add other properties like type, capacity, specific amenities if needed later
}

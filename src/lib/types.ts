
export type BookingStatus = 'Confirmed' | 'CheckedIn' | 'CheckedOut' | 'Cancelled';
export type BookingSource = 'Online' | 'Walk-in' | 'Phone' | 'Other';

export interface RoomPrice {
  roomNumber: number;
  price: number;
}

export interface ExtraItem {
  id: string; // For react-hook-form field array key
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

export interface Booking {
  id: string;
  guestName: string;
  guestContact: string;
  roomNumbers: number[];
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  roomPrices: RoomPrice[];
  extraItems?: ExtraItem[]; // Added
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

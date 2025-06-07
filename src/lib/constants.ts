
import type { BookingStatus, BookingSource } from './types';

export interface RoomConfig {
  id: number;
  name: string;
  defaultPrice: number;
}

export const ROOM_CONFIG: RoomConfig[] = [
  { id: 1, name: 'Gold Room', defaultPrice: 3000 },
  { id: 2, name: 'Gold Room', defaultPrice: 3000 },
  { id: 3, name: 'Platinum Room', defaultPrice: 3500 },
  { id: 4, name: 'Kids Room', defaultPrice: 1500 },
];

export const MAX_ROOMS = ROOM_CONFIG.length;
export const ROOM_NUMBERS: number[] = ROOM_CONFIG.map(room => room.id); // Still useful for some logic

export const BOOKING_STATUSES: BookingStatus[] = ['Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled'];
export const BOOKING_SOURCES: BookingSource[] = ['Online', 'Walk-in', 'Phone', 'Other'];

export const APP_NAME = "Palis Nest";

// Removed FULL_HOME_STAY_PRICE_PER_NIGHT constant


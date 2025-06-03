import type { BookingStatus, BookingSource } from './types';

export const MAX_ROOMS = 4;
export const ROOM_NUMBERS: number[] = Array.from({ length: MAX_ROOMS }, (_, i) => i + 1);

export const BOOKING_STATUSES: BookingStatus[] = ['Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled'];
export const BOOKING_SOURCES: BookingSource[] = ['Online', 'Walk-in', 'Phone', 'Other'];

export const APP_NAME = "Homestay Hub";

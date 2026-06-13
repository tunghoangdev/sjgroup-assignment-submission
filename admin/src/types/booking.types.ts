import type { Location } from './location.types';

export type BookingStatus = 'confirmed' | 'rejected' | 'cancelled';

export interface Booking {
  id: string;
  locationId: string;
  location?: Location;
  bookedBy: string;
  attendees: number;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  rejectReason: string | null;
  createdAt: string;
}

export interface CreateBookingDto {
  locationId: string;
  bookedBy: string;
  attendees: number;
  startTime: string;
  endTime: string;
}
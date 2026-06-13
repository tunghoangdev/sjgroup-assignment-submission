'use client';

import { BookingTable } from '@/components/bookings/booking-table';
import { useBookings } from '@/hooks/bookings/use-bookings';

export function BookingTableWrapper() {
  const { data: bookings, isLoading, isError, error } = useBookings();

  return (
    <BookingTable
      bookings={bookings}
      isLoading={isLoading}
      isError={isError}
      error={error}
    />
  );
}
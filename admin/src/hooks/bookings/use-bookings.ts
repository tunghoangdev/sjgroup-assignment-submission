import { useQuery } from '@tanstack/react-query';
import { bookingService } from '@/services/booking.service';
import { QUERY_KEYS } from '@/constants/api-endpoints';

export function useBookings() {
  return useQuery({
    queryKey: QUERY_KEYS.BOOKINGS.LIST,
    queryFn: bookingService.getAll,
  });
}
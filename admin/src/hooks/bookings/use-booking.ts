import { useQuery } from '@tanstack/react-query';
import { bookingService } from '@/services/booking.service';
import { QUERY_KEYS } from '@/constants/api-endpoints';

export function useBooking(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.BOOKINGS.DETAIL(id),
    queryFn: () => bookingService.getById(id),
    enabled: !!id,
  });
}
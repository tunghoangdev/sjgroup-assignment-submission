import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '@/services/booking.service';
import { QUERY_KEYS } from '@/constants/api-endpoints';
import { toast } from 'sonner';
import type { Booking } from '@/types/booking.types';

export function useCancelBooking(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => bookingService.cancel(id),

    onMutate: async () => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.BOOKINGS.DETAIL(id) });
      await qc.cancelQueries({ queryKey: QUERY_KEYS.BOOKINGS.LIST });

      const previousDetail = qc.getQueryData<Booking>(QUERY_KEYS.BOOKINGS.DETAIL(id));
      const previousList = qc.getQueryData<Booking[]>(QUERY_KEYS.BOOKINGS.LIST);

      // Optimistically update detail
      qc.setQueryData<Booking>(QUERY_KEYS.BOOKINGS.DETAIL(id), (old) => {
        if (!old) return old;
        return { ...old, status: 'cancelled' as const };
      });

      // Optimistically update list
      qc.setQueryData<Booking[]>(QUERY_KEYS.BOOKINGS.LIST, (old) => {
        if (!old) return old;
        return old.map((b) => (b.id === id ? { ...b, status: 'cancelled' as const } : b));
      });

      return { previousDetail, previousList };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousDetail) {
        qc.setQueryData(QUERY_KEYS.BOOKINGS.DETAIL(id), context.previousDetail);
      }
      if (context?.previousList) {
        qc.setQueryData(QUERY_KEYS.BOOKINGS.LIST, context.previousList);
      }
      toast.error(_err.message);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.BOOKINGS.LIST });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.BOOKINGS.DETAIL(id) });
      toast.success('Booking cancelled');
    },
  });
}

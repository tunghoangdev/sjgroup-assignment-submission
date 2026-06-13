import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '@/services/booking.service';
import { QUERY_KEYS } from '@/constants/api-endpoints';
import { toast } from 'sonner';
import type { Booking, CreateBookingDto } from '@/types/booking.types';

export function useCreateBooking() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: bookingService.create,

    onMutate: async (newBooking: CreateBookingDto) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.BOOKINGS.LIST });

      const previousList = qc.getQueryData<Booking[]>(QUERY_KEYS.BOOKINGS.LIST);

      const optimisticBooking: Booking = {
        id: `optimistic-${Date.now()}`,
        ...newBooking,
        status: 'confirmed',
        rejectReason: null,
        createdAt: new Date().toISOString(),
      };

      qc.setQueryData<Booking[]>(QUERY_KEYS.BOOKINGS.LIST, (old) => {
        if (!old) return [optimisticBooking];
        return [optimisticBooking, ...old];
      });

      return { previousList };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousList) {
        qc.setQueryData(QUERY_KEYS.BOOKINGS.LIST, context.previousList);
      }
      toast.error(_err.message);
    },

    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.BOOKINGS.LIST });
      if (data.status === 'rejected') {
        toast.warning(`Booking rejected: ${data.rejectReason}`);
      } else {
        toast.success('Booking confirmed!');
      }
    },
  });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { locationService } from '@/services/location.service';
import { QUERY_KEYS } from '@/constants/api-endpoints';
import { toast } from 'sonner';
import type { UpdateLocationDto, Location } from '@/types/location.types';

export function useUpdateLocation(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateLocationDto) => locationService.update(id, dto),

    onMutate: async (updatedVals: UpdateLocationDto) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.LOCATIONS.DETAIL(id) });
      await qc.cancelQueries({ queryKey: QUERY_KEYS.LOCATIONS.TREE });

      const previousDetail = qc.getQueryData<Location>(QUERY_KEYS.LOCATIONS.DETAIL(id));
      const previousTree = qc.getQueryData<Location[]>(QUERY_KEYS.LOCATIONS.TREE);

      // Optimistically update detail
      qc.setQueryData<Location>(QUERY_KEYS.LOCATIONS.DETAIL(id), (old) => {
        if (!old) return old;
        return { ...old, ...updatedVals, updatedAt: new Date().toISOString() } as Location;
      });

      return { previousDetail, previousTree };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousDetail) {
        qc.setQueryData(QUERY_KEYS.LOCATIONS.DETAIL(id), context.previousDetail);
      }
      if (context?.previousTree) {
        qc.setQueryData(QUERY_KEYS.LOCATIONS.TREE, context.previousTree);
      }
      toast.error(_err.message);
    },

    onSettled: () => {
      // Always refetch after error or success to ensure server state一致
      qc.invalidateQueries({ queryKey: QUERY_KEYS.LOCATIONS.TREE });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.LOCATIONS.DETAIL(id) });
      toast.success('Location updated');
    },
  });
}

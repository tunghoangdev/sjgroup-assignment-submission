import { useMutation, useQueryClient } from '@tanstack/react-query';
import { locationService } from '@/services/location.service';
import { QUERY_KEYS } from '@/constants/api-endpoints';
import { toast } from 'sonner';
import type { Location, CreateLocationDto } from '@/types/location.types';

export function useCreateLocation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: locationService.create,

    onMutate: async (newLocation: CreateLocationDto) => {
      // Cancel any outgoing refetches to prevent them from overwriting
      await qc.cancelQueries({ queryKey: QUERY_KEYS.LOCATIONS.TREE });

      // Snapshot previous value
      const previousTree = qc.getQueryData<Location[]>(QUERY_KEYS.LOCATIONS.TREE);

      // Optimistically update to the new value
      const optimisticLocation: Location = {
        id: `optimistic-${Date.now()}`,
        parent: newLocation.parent ? { id: newLocation.parent.id } : null,
        name: newLocation.name,
        locationNumber: newLocation.locationNumber,
        building: newLocation.building,
        department: { id: newLocation.department?.id ?? '', name: '', code: '' },
        capacity: newLocation.capacity ?? null,
        openTime: newLocation.openTime ?? null,
        type: newLocation.type,
        children: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      qc.setQueryData<Location[]>(QUERY_KEYS.LOCATIONS.TREE, (old) => {
        if (!old) return [optimisticLocation];
        return [...old, optimisticLocation];
      });

      return { previousTree };
    },

    onError: (_err, _variables, context) => {
      // Roll back to previous value on error
      if (context?.previousTree) {
        qc.setQueryData(QUERY_KEYS.LOCATIONS.TREE, context.previousTree);
      }
      toast.error(_err.message);
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.LOCATIONS.TREE });
      toast.success('Location created successfully');
    },
  });
}

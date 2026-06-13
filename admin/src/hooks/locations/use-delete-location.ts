import { useMutation, useQueryClient } from '@tanstack/react-query';
import { locationService } from '@/services/location.service';
import { QUERY_KEYS } from '@/constants/api-endpoints';
import { toast } from 'sonner';
import type { Location } from '@/types/location.types';

export function useDeleteLocation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: locationService.delete,

    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.LOCATIONS.TREE });

      const previousTree = qc.getQueryData<Location[]>(QUERY_KEYS.LOCATIONS.TREE);

      // Optimistically remove from tree
      qc.setQueryData<Location[]>(QUERY_KEYS.LOCATIONS.TREE, (old) => {
        if (!old) return old;
        return removeFromTree(old, id);
      });

      return { previousTree };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousTree) {
        qc.setQueryData(QUERY_KEYS.LOCATIONS.TREE, context.previousTree);
      }
      toast.error(_err.message);
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.LOCATIONS.TREE });
      toast.success('Location deleted');
    },
  });
}

function removeFromTree(locations: Location[], id: string): Location[] {
  return locations.reduce<Location[]>((acc, loc) => {
    if (loc.id === id) return acc;
    if (loc.children) {
      acc.push({ ...loc, children: removeFromTree(loc.children, id) });
    } else {
      acc.push(loc);
    }
    return acc;
  }, []);
}

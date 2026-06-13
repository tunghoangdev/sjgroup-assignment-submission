import { useQuery } from '@tanstack/react-query';
import { locationService } from '@/services/location.service';
import { QUERY_KEYS } from '@/constants/api-endpoints';

export function useLocationsTree() {
  return useQuery({
    queryKey: QUERY_KEYS.LOCATIONS.TREE,
    queryFn: locationService.getTree,
    staleTime: 1000 * 60 * 5, // 5 min
  });
}
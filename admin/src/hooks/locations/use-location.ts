import { useQuery } from '@tanstack/react-query';
import { locationService } from '@/services/location.service';
import { QUERY_KEYS } from '@/constants/api-endpoints';

export function useLocation(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.LOCATIONS.DETAIL(id),
    queryFn: () => locationService.getById(id),
    enabled: !!id,
  });
}
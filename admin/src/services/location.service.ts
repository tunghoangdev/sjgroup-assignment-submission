import { apiClient } from '@/lib/axios';
import { LOCATION_ENDPOINTS } from '@/constants/api-endpoints';
import type { Location, CreateLocationDto, UpdateLocationDto } from '@/types/location.types';

export const locationService = {
  getTree: () =>
    apiClient.get<Location[]>(LOCATION_ENDPOINTS.GET_TREE).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Location>(LOCATION_ENDPOINTS.GET_BY_ID(id)).then((r) => r.data),

  create: (dto: CreateLocationDto) =>
    apiClient.post<Location>(LOCATION_ENDPOINTS.CREATE, dto).then((r) => r.data),

  update: (id: string, dto: UpdateLocationDto) =>
    apiClient.patch<Location>(LOCATION_ENDPOINTS.UPDATE(id), dto).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(LOCATION_ENDPOINTS.DELETE(id)).then((r) => r.data),
};
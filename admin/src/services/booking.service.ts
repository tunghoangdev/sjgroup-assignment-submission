import { apiClient } from '@/lib/axios';
import { BOOKING_ENDPOINTS } from '@/constants/api-endpoints';
import type { Booking, CreateBookingDto } from '@/types/booking.types';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const bookingService = {
  getAll: () =>
    apiClient
      .get<PaginatedResponse<Booking>>(BOOKING_ENDPOINTS.GET_ALL)
      .then((r) => r.data.data),

  getById: (id: string) =>
    apiClient.get<Booking>(BOOKING_ENDPOINTS.GET_BY_ID(id)).then((r) => r.data),

  create: (dto: CreateBookingDto) =>
    apiClient.post<Booking>(BOOKING_ENDPOINTS.CREATE, dto).then((r) => r.data),

  cancel: (id: string) =>
    apiClient.patch<Booking>(BOOKING_ENDPOINTS.CANCEL(id)).then((r) => r.data),
};
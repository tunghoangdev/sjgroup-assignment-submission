const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';

export const API_BASE_URL = BASE_URL;

// ─── Location Endpoints ────────────────────────────────────────────
export const LOCATION_ENDPOINTS = {
  /** GET /locations — full tree */
  GET_TREE: '/locations',

  /** GET /locations/:id — single node + children */
  GET_BY_ID: (id: string) => `/locations/${id}`,

  /** POST /locations — create new node */
  CREATE: '/locations',

  /** PATCH /locations/:id — update attributes */
  UPDATE: (id: string) => `/locations/${id}`,

  /** DELETE /locations/:id — remove node */
  DELETE: (id: string) => `/locations/${id}`,
} as const;

// ─── Booking Endpoints ─────────────────────────────────────────────
export const BOOKING_ENDPOINTS = {
  /** GET /bookings — list all bookings */
  GET_ALL: '/bookings',

  /** GET /bookings/:id — single booking detail */
  GET_BY_ID: (id: string) => `/bookings/${id}`,

  /** POST /bookings — create booking (triggers validation) */
  CREATE: '/bookings',

  /** PATCH /bookings/:id/cancel — cancel booking */
  CANCEL: (id: string) => `/bookings/${id}/cancel`,
} as const;

// ─── Query Keys ────────────────────────────────────────────────────
export const QUERY_KEYS = {
  LOCATIONS: {
    TREE: ['locations', 'tree'] as const,
    DETAIL: (id: string) => ['locations', 'detail', id] as const,
  },
  BOOKINGS: {
    LIST: ['bookings', 'list'] as const,
    DETAIL: (id: string) => ['bookings', 'detail', id] as const,
  },
} as const;
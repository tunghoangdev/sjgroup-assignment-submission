# SJ Assignment — Location & Booking Management

A Next.js 15 dashboard application for managing hierarchical locations and bookings.

## Prerequisites

- **Node.js** 20+
- **npm** 10+

## Setup & Run

```bash
# 1. Clone the repository
git clone <repo-url>
cd sj-assignment-fe

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local if your API is running on a different host

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the Locations page.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:3000` | Backend API base URL |

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 15 (App Router) | Framework |
| TypeScript | Type safety |
| shadcn/ui Dashboard | UI components |
| Tailwind CSS v4 | Styling |
| TanStack Query v5 | Server state & caching |
| Axios | HTTP client |
| React Hook Form + Zod | Form validation |
| date-fns | Date utilities |
| Lucide React | Icons |
| Sonner | Toast notifications |

## Project Structure

```
src/
├── app/
│   ├── layout.tsx               ← Root layout + Providers + Dashboard shell
│   ├── providers.tsx            ← QueryClientProvider + TooltipProvider + Toaster
│   ├── page.tsx                 ← Redirect → /locations
│   ├── locations/
│   │   ├── page.tsx             ← Location tree page
│   │   ├── [id]/page.tsx        ← Location detail + edit + delete
│   │   └── new/page.tsx         ← Create location form
│   └── bookings/
│       ├── page.tsx             ← Booking list with filterable table
│       ├── [id]/page.tsx        ← Booking detail + cancel
│       └── new/page.tsx         ← Create booking form
├── components/
│   ├── layout/                  ← Dashboard layout (sidebar, header)
│   ├── locations/               ← Location tree, form, detail card, delete dialog
│   └── bookings/                ← Booking table, form, detail card, cancel dialog, status badge
├── hooks/
│   ├── locations/               ← TanStack Query hooks (tree, detail, CRUD)
│   └── bookings/                ← TanStack Query hooks (list, detail, create, cancel)
├── services/
│   ├── location.service.ts      ← Location API calls
│   └── booking.service.ts       ← Booking API calls
├── constants/
│   └── api-endpoints.ts         ← All endpoint URLs + query keys
├── types/
│   ├── location.types.ts        ← Location interfaces
│   └── booking.types.ts         ← Booking interfaces
└── lib/
    ├── axios.ts                 ← Axios instance with interceptors
    └── utils.ts                 ← cn() helper
```

## Conventions

- **No hardcoded URLs**: All endpoints are imported from `LOCATION_ENDPOINTS` / `BOOKING_ENDPOINTS` constants.
- **No hardcoded query keys**: All query keys use `QUERY_KEYS.LOCATIONS.*` / `QUERY_KEYS.BOOKINGS.*`.
- **Mutations invalidate cache**: Every `useMutation` `onSuccess` handler calls `invalidateQueries` on related caches.
- **Unified toasts**: All user notifications use `sonner` toast — `success`, `error`, or `warning`.
- **Skeleton loading states**: Every data-driven page shows skeleton placeholders, not empty spinners.
- **Error boundaries**: Each data section checks `isError` and displays error messages.
- **Server Components by default**: Only use `'use client'` when hooks or event handlers are needed.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/locations` | Get full location tree |
| GET | `/locations/:id` | Get single location + children |
| POST | `/locations` | Create location |
| PATCH | `/locations/:id` | Update location |
| DELETE | `/locations/:id` | Delete location |
| GET | `/bookings` | List all bookings |
| GET | `/bookings/:id` | Get single booking |
| POST | `/bookings` | Create booking (validates conflicts) |
| PATCH | `/bookings/:id/cancel` | Cancel booking |
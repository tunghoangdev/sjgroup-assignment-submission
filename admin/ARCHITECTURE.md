# Architecture Notes

## API Layer Convention

### Endpoint Constants (`src/constants/api-endpoints.ts`)

Every API URL is defined as a constant. **Never hardcode a URL string** in a service, hook, or component.

```typescript
// ✅ Correct
import { LOCATION_ENDPOINTS } from '@/constants/api-endpoints';
apiClient.get(LOCATION_ENDPOINTS.GET_TREE);

// ❌ Wrong — hardcoded URL
apiClient.get('/locations');
```

### Query Keys

All TanStack Query keys come from `QUERY_KEYS` exported by the same constants file. This ensures cache invalidation is always consistent.

```typescript
// ✅ Correct
queryKey: QUERY_KEYS.LOCATIONS.TREE

// ❌ Wrong — hardcoded string array
queryKey: ['locations', 'tree']
```

## State Management

- **Server state**: TanStack Query v5 — all data fetched from the API lives in the query cache.
- **No client-side state library** (no Redux, Zustand, etc.) — form state uses React Hook Form, UI state uses `useState`.
- **Cache invalidation**: Every mutation hook invalidates the relevant query keys on success so the UI stays in sync automatically.

## Component Architecture

### Layout Components

- `DashboardLayout` wraps the entire app with `SidebarProvider` + `AppSidebar` + `AppHeader`.
- `Providers` wraps the app with `QueryClientProvider`, `TooltipProvider`, and `Toaster` (Sonner).

### Page Structure

Each page follows the same pattern:

```
page.tsx
├── Header (title + action button)
├── Card
│   ├── CardHeader (title + description)
│   └── CardContent (data component)
```

### Data Components Pattern

Data-fetching components handle three states:

1. **Loading** → `<Skeleton>` placeholders
2. **Error** → Error panel with icon + message
3. **Empty** → Dashed border empty state with guidance text
4. **Data** → Actual UI

## Hook Naming Convention

```
use[Resource]        → Query hook  (e.g., useLocationsTree, useBooking)
use[Create|Update|Delete|Cancel][Resource] → Mutation hook
```

## Build & Deploy

```bash
npm run build    # Production build (runs TypeScript check)
npm start        # Start production server
npm run dev      # Development server with HMR
```
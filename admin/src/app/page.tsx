'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, CalendarCheck, CalendarX, MapPin, Plus } from 'lucide-react';
import { useBookings } from '@/hooks/bookings/use-bookings';
import { useLocationsTree } from '@/hooks/locations/use-locations-tree';
import { StatCard } from '@/components/dashboard/stat-card';
import { BookingStatusChart } from '@/components/dashboard/booking-status-chart';
import { LocationTypeChart } from '@/components/dashboard/location-type-chart';
import { RecentBookings } from '@/components/dashboard/recent-bookings';
import { AnimatedPage } from '@/components/animated-page';
import { Button } from '@/components/ui/button';
import type { BookingStatus, Booking } from '@/types/booking.types';
import type { LocationType, Location } from '@/types/location.types';

function flattenTree(nodes: Location[]): Location[] {
  const result: Location[] = [];
  function walk(list: Location[]) {
    for (const node of list) {
      result.push(node);
      if (node.children) walk(node.children);
    }
  }
  walk(nodes);
  return result;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: bookings, isLoading: bookingsLoading, isError: bookingsError } = useBookings();
  const { data: locations, isLoading: locationsLoading, isError: locationsError } = useLocationsTree();

  const isLoading = bookingsLoading || locationsLoading;
  const isError = bookingsError || locationsError;

  const stats = useMemo(() => {
    const bookingsArray: Booking[] = Array.isArray(bookings) ? bookings : [];
    const allLocations = flattenTree(locations ?? []);

    const statusCounts: Record<BookingStatus, number> = {
      confirmed: 0,
      rejected: 0,
      cancelled: 0,
    };
    bookingsArray.forEach((b) => {
      if (b.status in statusCounts) {
        statusCounts[b.status]++;
      }
    });

    const typeCounts: Record<LocationType, number> = {
      building: 0,
      floor: 0,
      room: 0,
    };
    allLocations.forEach((l) => {
      if (l.type in typeCounts) {
        typeCounts[l.type]++;
      }
    });

    return {
      totalBookings: bookingsArray.length,
      totalLocations: allLocations.length,
      confirmedBookings: statusCounts.confirmed,
      cancelledBookings: statusCounts.cancelled + statusCounts.rejected,
      statusCounts,
      typeCounts,
    };
  }, [bookings, locations]);

  const confirmationRate =
    stats.totalBookings > 0
      ? Math.round((stats.confirmedBookings / stats.totalBookings) * 100)
      : 0;

  return (
    <AnimatedPage stagger>
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your location and booking management system.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => router.push('/locations/new')} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          New Location
        </Button>
        <Button onClick={() => router.push('/bookings/new')} size="sm" variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          New Booking
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4 lg:gap-3">
        <StatCard
          title="Total Locations"
          value={stats.totalLocations}
          description="Across all types"
          icon={MapPin}
          isLoading={isLoading}
          trend={
            !isLoading
              ? {
                  value: stats.typeCounts.room,
                  label: 'rooms',
                }
              : undefined
          }
        />
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings}
          description="All time"
          icon={CalendarCheck}
          isLoading={isLoading}
        />
        <StatCard
          title="Confirmed"
          value={stats.confirmedBookings}
          description={`${confirmationRate}% confirmation rate`}
          icon={Building2}
          isLoading={isLoading}
        />
        <StatCard
          title="Cancelled / Rejected"
          value={stats.cancelledBookings}
          description="Combined non-confirmed"
          icon={CalendarX}
          isLoading={isLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <BookingStatusChart data={stats.statusCounts} isLoading={isLoading} />
        <LocationTypeChart data={stats.typeCounts} isLoading={isLoading} />
      </div>

      {/* Recent Bookings */}
      <RecentBookings bookings={bookings} isLoading={isLoading} limit={5} />

      {/* Error State */}
      {isError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">
          Some data failed to load. Check your API connection and try refreshing.
        </div>
      )}
    </AnimatedPage>
  );
}
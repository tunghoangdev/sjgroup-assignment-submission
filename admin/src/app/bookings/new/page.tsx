'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookingForm } from '@/components/bookings/booking-form';
import { useCreateBooking } from '@/hooks/bookings/use-create-booking';
import { useLocationsTree } from '@/hooks/locations/use-locations-tree';
import { AnimatedPage, AnimatedCard } from '@/components/animated-page';
import type { CreateBookingDto } from '@/types/booking.types';
import type { Location } from '@/types/location.types';

function flattenToRooms(nodes: Location[]): Location[] {
  const rooms: Location[] = [];
  function walk(list: Location[]) {
    for (const node of list) {
      if (node.type === 'room') rooms.push(node);
      if (node.children) walk(node.children);
    }
  }
  walk(nodes);
  return rooms;
}

export default function NewBookingPage() {
  const router = useRouter();
  const { data: locations } = useLocationsTree();
  const createMutation = useCreateBooking();

  const rooms = useMemo(
    () => flattenToRooms(locations ?? []),
    [locations],
  );

  const handleSubmit = (dto: CreateBookingDto) => {
    createMutation.mutate(dto, {
      onSuccess: () => {
        router.push('/bookings');
      },
    });
  };

  return (
    <AnimatedPage className="space-y-4 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Booking</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create a new booking for a location. Validation will run
          automatically.
        </p>
      </div>

      <AnimatedCard hover={false}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Booking Details</CardTitle>
            <CardDescription>
              Select a location, fill in the time range, and submit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BookingForm
              locations={rooms}
              onSubmit={handleSubmit}
              isSubmitting={createMutation.isPending}
            />
          </CardContent>
        </Card>
      </AnimatedCard>
    </AnimatedPage>
  );
}
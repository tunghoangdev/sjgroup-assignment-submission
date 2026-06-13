'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import { BookingTableWrapper } from './booking-table-wrapper';
import { AnimatedPage, AnimatedCard } from '@/components/animated-page';

export default function BookingsPage() {
  const router = useRouter();

  return (
    <AnimatedPage className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage all location bookings.
          </p>
        </div>
        <Button onClick={() => router.push('/bookings/new')}>
          <Plus className="h-4 w-4" />
          New Booking
        </Button>
      </div>

      <AnimatedCard>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Bookings</CardTitle>
            <CardDescription>
              Filter by status and view booking details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full mb-2" />
              ))}
            >
              <BookingTableWrapper />
            </Suspense>
          </CardContent>
        </Card>
      </AnimatedCard>
    </AnimatedPage>
  );
}
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookingStatusBadge } from '@/components/bookings/booking-status-badge';
import { ArrowRight, Eye } from 'lucide-react';
import type { Booking } from '@/types/booking.types';

interface RecentBookingsProps {
  bookings?: Booking[];
  isLoading?: boolean;
  limit?: number;
}

export function RecentBookings({
  bookings,
  isLoading = false,
  limit = 5,
}: RecentBookingsProps) {
  const router = useRouter();

  const recent = bookings?.slice(0, limit) ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Recent Bookings</CardTitle>
          <CardDescription>Latest {limit} booking activities</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-xs"
          onClick={() => router.push('/bookings')}
        >
          View all <ArrowRight className="h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-6 text-muted-foreground">
            <p className="text-sm">No bookings yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Booked By</TableHead>
                <TableHead className="text-xs">Location</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="text-sm font-medium">
                    {booking.bookedBy}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {booking.location?.name ?? booking.locationId}
                  </TableCell>
                  <TableCell>
                    <BookingStatusBadge status={booking.status} />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => router.push(`/bookings/${booking.id}`)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
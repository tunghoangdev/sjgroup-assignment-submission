'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Eye, XCircle } from 'lucide-react';
import { BookingStatusBadge } from './booking-status-badge';
import { cn } from '@/lib/utils';
import type { Booking, BookingStatus } from '@/types/booking.types';

interface BookingTableProps {
  bookings?: Booking[];
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
}

export function BookingTable({
  bookings,
  isLoading,
  isError,
  error,
}: BookingTableProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');

  const bookingsArray = Array.isArray(bookings) ? bookings : [];
  const filtered = statusFilter === 'all'
    ? bookingsArray
    : bookingsArray.filter((b) => b.status === statusFilter);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        <AlertCircle className="h-4 w-4" />
        <p className="text-sm">{(error as Error)?.message ?? 'Failed to load bookings'}</p>
      </div>
    );
  }

  if (bookingsArray.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-muted-foreground">
        <p className="text-sm">No bookings found.</p>
        <p className="text-xs mt-1">Create your first booking to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Filter by status:</span>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as BookingStatus | 'all')}
        >
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered?.length ?? 0} of {bookingsArray.length} bookings
        </span>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booked By</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Attendees</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered?.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">
                  {booking.bookedBy}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {booking.location?.name ?? booking.locationId}
                </TableCell>
                <TableCell className="text-sm">
                  <div>
                    {new Date(booking.startTime).toLocaleString()}
                  </div>
                  <div className="text-muted-foreground">
                    → {new Date(booking.endTime).toLocaleString()}
                  </div>
                </TableCell>
                <TableCell>{booking.attendees}</TableCell>
                <TableCell>
                  <BookingStatusBadge status={booking.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => router.push(`/bookings/${booking.id}`)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    {booking.status === 'confirmed' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          router.push(`/bookings/${booking.id}?action=cancel`)
                        }
                      >
                        <XCircle className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
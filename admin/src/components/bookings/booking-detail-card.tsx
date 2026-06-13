'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Calendar, Clock, MapPin, Users, User } from 'lucide-react';
import { BookingStatusBadge } from './booking-status-badge';
import type { Booking } from '@/types/booking.types';

interface BookingDetailCardProps {
  booking?: Booking;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
}

export function BookingDetailCard({
  booking,
  isLoading,
  isError,
  error,
}: BookingDetailCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="border-destructive/50 bg-destructive/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Error Loading Booking
          </CardTitle>
          <CardDescription className="text-destructive">
            {error?.message ?? 'Failed to load booking details'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!booking) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <CardTitle>Booking Detail</CardTitle>
          <BookingStatusBadge status={booking.status} />
        </div>
        <CardDescription>
          Booking by {booking.bookedBy}
        </CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4 space-y-3">
        {/* Booked By */}
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium">Booked By:</span>
          <span>{booking.bookedBy}</span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium">Location:</span>
          <span>
            {booking.location?.name ?? booking.locationId}
            {booking.location && (
              <span className="text-muted-foreground">
                {' '}
                ({booking.location.locationNumber})
              </span>
            )}
          </span>
        </div>

        {/* Attendees */}
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium">Attendees:</span>
          <span>{booking.attendees}</span>
        </div>

        {/* Time */}
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium">Time:</span>
          <span>
            {new Date(booking.startTime).toLocaleString()} →{' '}
            {new Date(booking.endTime).toLocaleString()}
          </span>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium">Created:</span>
          <span>{new Date(booking.createdAt).toLocaleString()}</span>
        </div>

        {/* Rejection Reason */}
        {booking.status === 'rejected' && booking.rejectReason && (
          <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-sm font-medium text-destructive">
              Rejection Reason
            </p>
            <p className="text-sm text-destructive/80 mt-1">
              {booking.rejectReason}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
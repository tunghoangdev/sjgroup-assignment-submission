'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BookingDetailCard } from '@/components/bookings/booking-detail-card';
import { BookingCancelDialog } from '@/components/bookings/booking-cancel-dialog';
import { useBooking } from '@/hooks/bookings/use-booking';
import { useCancelBooking } from '@/hooks/bookings/use-cancel-booking';
import { AnimatedPage, FadeIn } from '@/components/animated-page';
import { ArrowLeft, XCircle } from 'lucide-react';

export default function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ action?: string }>;
}) {
  const { id } = use(params);
  const { action } = use(searchParams);
  const router = useRouter();

  const { data: booking, isLoading, isError, error } = useBooking(id);
  const cancelMutation = useCancelBooking(id);

  const [showCancelDialog, setShowCancelDialog] = useState(
    action === 'cancel'
  );

  const handleCancel = () => {
    cancelMutation.mutate(undefined, {
      onSuccess: () => {
        setShowCancelDialog(false);
      },
    });
  };

  return (
    <AnimatedPage className="space-y-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => router.push('/bookings')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Booking Detail
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              View booking information and manage status.
            </p>
          </div>
        </div>
        {booking?.status === 'confirmed' && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowCancelDialog(true)}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancel Booking
          </Button>
        )}
      </div>

      {/* Detail Card */}
      <FadeIn>
        <BookingDetailCard
          booking={booking}
          isLoading={isLoading}
          isError={isError}
          error={error}
        />
      </FadeIn>

      {/* Cancel Dialog */}
      <BookingCancelDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        bookingInfo={booking ? `booking by ${booking.bookedBy}` : undefined}
        onConfirm={handleCancel}
        isCancelling={cancelMutation.isPending}
      />
    </AnimatedPage>
  );
}
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { CreateBookingDto } from "@/types/booking.types";
import type { Department, Location } from "@/types/location.types";

const bookingFormSchema = z
  .object({
    locationId: z.any().refine((val) => {
      if (!val) return false;
      if (typeof val === "string") return val.trim().length > 0;
      return typeof val === "object" && !!val.id;
    }, "Location is required"),
    bookedBy: z.string().min(1, "Booked by is required"),
    attendees: z.coerce.number().int().positive("Must be at least 1"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  locations?: Location[];
  onSubmit: (values: CreateBookingDto) => void;
  isSubmitting?: boolean;
  className?: string;
}

export function BookingForm({
  locations = [],
  onSubmit,
  isSubmitting = false,
  className,
}: BookingFormProps) {
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      locationId: "",
      bookedBy: "",
      attendees: 1,
      startTime: "",
      endTime: "",
    },
  });

  const handleSubmit = (values: BookingFormValues) => {
    const locId =
      typeof values.locationId === "object" && values.locationId
        ? (values.locationId as Location).id
        : values.locationId;
    const dto: CreateBookingDto = {
      locationId: locId,
      bookedBy: values.bookedBy,
      attendees: values.attendees,
      startTime: new Date(values.startTime).toISOString(),
      endTime: new Date(values.endTime).toISOString(),
    };
    onSubmit(dto);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn("space-y-4", className)}
      >
        {/* Location */}
        <FormField
          control={form.control}
          name="locationId"
          render={({ field }) => {
            const selectedLoc =
              typeof field.value === "object" && field.value
                ? (field.value as Location)
                : locations.find((l) => l.id === field.value);
            return (
              <FormItem>
                <FormLabel>Location *</FormLabel>
                <Select
                  onValueChange={(val: any) => {
                    field.onChange(val);
                    const selected =
                      typeof val === "object" && val
                        ? (val as Location)
                        : locations.find((l) => l.id === val);
                    const deptCode = selected?.department
                      ? typeof selected.department === "object"
                        ? (selected.department as Department).code
                        : selected.department
                      : "";
                    if (deptCode) {
                      form.setValue("bookedBy", deptCode, {
                        shouldValidate: true,
                      });
                    }
                  }}
                  value={field.value}
                  itemToStringLabel={(location) => location?.name ?? ""}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a room" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {locations.length === 0 ? (
                      <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                        No rooms available. Create a room first.
                      </div>
                    ) : (
                      locations.map((location) => (
                        <SelectItem key={location.id} value={location}>
                          {location.name} ({location.locationNumber})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {selectedLoc && (
                  <FormDescription>
                    {[
                      selectedLoc.building &&
                        `Building: ${selectedLoc.building}`,
                      selectedLoc.department &&
                        `Department: ${
                          typeof selectedLoc.department === "object"
                            ? selectedLoc.department.name
                            : selectedLoc.department
                        }`,
                      selectedLoc.capacity != null &&
                        `Capacity: ${selectedLoc.capacity}`,
                      selectedLoc.openTime &&
                        `Open Time: ${selectedLoc.openTime}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            );
          }}
        />

        {/* Booked By */}
        <FormField
          control={form.control}
          name="bookedBy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Booked By *</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormDescription>
                Must match the room's department.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Attendees */}
        <FormField
          control={form.control}
          name="attendees"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Attendees *</FormLabel>
              <FormControl>
                <Input type="number" min={1} placeholder="5" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Start Time */}
        <FormField
          control={form.control}
          name="startTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Time *</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* End Time */}
        <FormField
          control={form.control}
          name="endTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Time *</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? "Creating..." : "Create Booking"}
        </Button>
      </form>
    </Form>
  );
}

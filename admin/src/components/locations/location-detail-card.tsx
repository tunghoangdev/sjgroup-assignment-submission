'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Building, Layers, DoorClosed, MapPin, Hash, Clock, Users, Briefcase } from 'lucide-react';
import type { Location } from '@/types/location.types';

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  building: Building,
  floor: Layers,
  room: DoorClosed,
  other: MapPin,
};

interface LocationDetailCardProps {
  location?: Location;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  parentName?: string;
}

export function LocationDetailCard({
  location,
  isLoading,
  isError,
  error,
  parentName,
}: LocationDetailCardProps) {
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
            Error Loading Location
          </CardTitle>
          <CardDescription className="text-destructive">
            {error?.message ?? 'Failed to load location details'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!location) return null;

  const Icon = TYPE_ICONS[location.type] ?? MapPin;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <CardTitle>{location.name}</CardTitle>
          <Badge variant="secondary">{location.type}</Badge>
        </div>
        <CardDescription>
          Location #{location.locationNumber}
        </CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium">Location Number:</span>
          <span>{location.locationNumber}</span>
        </div>

        {location.building && (
          <div className="flex items-center gap-2 text-sm">
            <Building className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium">Building:</span>
            <span>{location.building}</span>
          </div>
        )}

        {location.department && (
          <div className="flex items-center gap-2 text-sm">
            <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium">Department:</span>
            <span>{typeof location.department === 'object' ? (location.department as any).name || (location.department as any).code : location.department}</span>
          </div>
        )}

        {location.capacity != null && (
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium">Capacity:</span>
            <span>{location.capacity} people</span>
          </div>
        )}

        {location.openTime && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium">Open Time:</span>
            <span>{location.openTime}</span>
          </div>
        )}

        {location.parent?.id && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium">Parent:</span>
            <span>{parentName ?? location.parent.id}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
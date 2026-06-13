'use client';

import { useLocationsTree } from '@/hooks/locations/use-locations-tree';
import { LocationTreeNode } from './location-tree-node';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import type { Location } from '@/types/location.types';

export function LocationTree() {
  const { data: locations, isLoading, isError, error } = useLocationsTree();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        <AlertCircle className="h-4 w-4" />
        <p className="text-sm">{(error as Error)?.message ?? 'Failed to load locations'}</p>
      </div>
    );
  }

  if (!locations || locations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-muted-foreground">
        <p className="text-sm">No locations found.</p>
        <p className="text-xs mt-1">Create your first location to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {locations.map((location: Location) => (
        <LocationTreeNode key={location.id} location={location} depth={0} />
      ))}
    </div>
  );
}
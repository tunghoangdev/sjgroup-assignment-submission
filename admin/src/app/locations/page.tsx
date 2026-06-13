'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import { LocationTree } from '@/components/locations/location-tree';
import { AnimatedPage, AnimatedCard } from '@/components/animated-page';

export default function LocationsPage() {
  const router = useRouter();

  return (
    <AnimatedPage className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Locations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your location hierarchy — buildings, floors, and rooms.
          </p>
        </div>
        <Button onClick={() => router.push('/locations/new')}>
          <Plus className="h-4 w-4" />
          Add Location
        </Button>
      </div>

      <AnimatedCard>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Location Tree</CardTitle>
            <CardDescription>
              Click to expand/collapse nodes. Use the action menu to edit or
              delete.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full mb-2" />
              ))}
            >
              <LocationTree />
            </Suspense>
          </CardContent>
        </Card>
      </AnimatedCard>
    </AnimatedPage>
  );
}
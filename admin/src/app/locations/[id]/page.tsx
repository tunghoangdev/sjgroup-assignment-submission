'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LocationDetailCard } from '@/components/locations/location-detail-card';
import { LocationForm } from '@/components/locations/location-form';
import { LocationDeleteDialog } from '@/components/locations/location-delete-dialog';
import { useLocation } from '@/hooks/locations/use-location';
import { useUpdateLocation } from '@/hooks/locations/use-update-location';
import { useDeleteLocation } from '@/hooks/locations/use-delete-location';
import { useLocationsTree } from '@/hooks/locations/use-locations-tree';
import { AnimatedPage, FadeIn } from '@/components/animated-page';
import { Edit, Trash2, ArrowLeft } from 'lucide-react';
import type { CreateLocationDto, Location } from '@/types/location.types';

export default function LocationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ action?: string }>;
}) {
  const { id } = use(params);
  const { action } = use(searchParams);
  const router = useRouter();

  const { data: location, isLoading, isError, error } = useLocation(id);
  const { data: allLocations } = useLocationsTree();
  const updateMutation = useUpdateLocation(id);
  const deleteMutation = useDeleteLocation();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(
    action === 'delete'
  );

  const flattenLocations = (nodes: Location[]): Location[] =>
    nodes.reduce((acc: Location[], node) => {
      acc.push(node);
      if (node.children) acc.push(...flattenLocations(node.children));
      return acc;
    }, []);

  const flatLocations = flattenLocations(allLocations ?? []);

  const parentName = location?.parent?.id
    ? flatLocations.find((l) => l.id === location.parent?.id)?.name
    : undefined;

  const parentOptions =
    flatLocations
      .filter((l) => l.id !== id)
      .map((l) => ({ id: l.id, name: l.name, building: l.building, type: l.type }));

  const handleUpdate = (dto: CreateLocationDto) => {
    updateMutation.mutate(dto, {
      onSuccess: () => {
        setIsEditing(false);
      },
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setShowDeleteDialog(false);
        router.push('/locations');
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
            onClick={() => router.push('/locations')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Location Detail
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage this location.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit className="h-4 w-4 mr-2" />
            {isEditing ? 'Cancel Edit' : 'Edit'}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Detail Card */}
      <FadeIn>
        <LocationDetailCard
          location={location}
          isLoading={isLoading}
          isError={isError}
          error={error}
          parentName={parentName}
        />
      </FadeIn>

      {/* Edit Form */}
      {isEditing && location && (
        <FadeIn>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Edit Location</CardTitle>
              <CardDescription>
                Update the fields below and save.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LocationForm
                defaultValues={location}
                parentOptions={parentOptions}
                onSubmit={handleUpdate}
                isSubmitting={updateMutation.isPending}
              />
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Delete Dialog */}
      <LocationDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        locationName={location?.name}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
      />
    </AnimatedPage>
  );
}
"use client";

import { useRouter } from "next/navigation";
import { LocationForm } from "@/components/locations/location-form";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useCreateLocation } from "@/hooks/locations/use-create-location";
import { useLocationsTree } from "@/hooks/locations/use-locations-tree";
import { AnimatedPage, AnimatedCard } from "@/components/animated-page";
import type { CreateLocationDto, Location } from "@/types/location.types";

export default function NewLocationPage() {
	const router = useRouter();
	const { data: locations } = useLocationsTree();
	const createMutation = useCreateLocation();

	const flattenLocations = (nodes: Location[]): Location[] => {
		return nodes.reduce((acc: Location[], node) => {
			acc.push(node);
			if (node.children) {
				acc.push(...flattenLocations(node.children));
			}
			return acc;
		}, []);
	};

	const parentOptions =
		flattenLocations(locations ?? []).map((l) => ({
			id: l.id,
			name: l.name,
			building: l.building,
			type: l.type,
		})) ?? [];

	const handleSubmit = (dto: CreateLocationDto) => {
		createMutation.mutate(dto, {
			onSuccess: () => {
				router.push("/locations");
			},
		});
	};

	return (
		<AnimatedPage className="space-y-4 max-w-xl">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Create Location</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Add a new building, floor, room, or other location to the hierarchy.
				</p>
			</div>

			<AnimatedCard hover={false}>
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Location Details</CardTitle>
						<CardDescription>Fill in the required fields below.</CardDescription>
					</CardHeader>
					<CardContent>
						<LocationForm
							parentOptions={parentOptions}
							onSubmit={handleSubmit}
							isSubmitting={createMutation.isPending}
						/>
					</CardContent>
				</Card>
			</AnimatedCard>
		</AnimatedPage>
	);
}

export type LocationType = "building" | "floor" | "room";

export interface Department {
	id: string;
	name: string;
	code: string;
}

export interface Location {
	id: string;
	parent?: { id: string; name?: string } | null;
	name: string;
	locationNumber: string;
	building: string;
	department: Department;
	capacity: number | null;
	openTime: string | null;
	type: LocationType;
	children?: Location[];
	createdAt: string;
	updatedAt: string;
}

export interface LocationOption {
	id: string;
	name: string;
	building: string;
}

export interface CreateLocationDto {
	parent?: { id: string } | null;
	name: string;
	locationNumber: string;
	building: string;
	department?: { id: string } | null;
	capacity?: number;
	openTime?: string;
	type: LocationType;
}

export interface UpdateLocationDto extends Partial<CreateLocationDto> {}

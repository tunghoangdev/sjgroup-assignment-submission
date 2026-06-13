"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
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
import { useCreateDepartment } from "@/hooks/departments/use-create-department";
import { useDepartments } from "@/hooks/departments/use-departments";
import { cn } from "@/lib/utils";
import type {
	CreateLocationDto,
	Location,
	LocationType,
} from "@/types/location.types";

// ─── Constants ────────────────────────────────────────────────────────────────

// Define valid parent types allowed for each location type level
const PARENT_TYPE_MAP: Record<string, LocationType[]> = {
	floor: ["building"],
	room: ["floor", "room"], // Supports nested room structures (room-in-room)
};

// ─── Schema Validation (Zod) ──────────────────────────────────────────────────

const locationFormSchema = z
	.object({
		name: z.string().min(1, "Name is required"),
		locationNumber: z.string().min(1, "Location number is required"),
		building: z.string().min(1, "Building is required"),
		type: z.enum(["building", "floor", "room"]),
		parentId: z.string().optional().nullable(),
		departmentId: z.string().optional().nullable(),
		// Convert empty string or falsy inputs to null to prevent Zod type coercion failure
		capacity: z.preprocess(
			(val) =>
				val === "" || val === null || val === undefined ? null : Number(val),
			z.number().positive("Must be a positive number").nullable().optional(),
		) as z.ZodType<number | null | undefined>,
		openTime: z.string().optional().nullable(),
	})
	// Enforce conditional validation: 'floor' and 'room' must have a parent location
	.superRefine((data, ctx) => {
		if ((data.type === "floor" || data.type === "room") && !data.parentId) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: `Parent Location is required when type is ${data.type}.`,
				path: ["parentId"], // Points the validation error directly to the parentId form field
			});
		}
	});

export type LocationFormValues = z.infer<typeof locationFormSchema>;

// ─── Component Props ──────────────────────────────────────────────────────────

interface LocationFormProps {
	defaultValues?: Partial<Location>;
	parentOptions?: {
		id: string;
		name: string;
		building: string;
		type: LocationType;
	}[];
	onSubmit: (values: CreateLocationDto) => void;
	isSubmitting?: boolean;
	className?: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LocationForm({
	defaultValues,
	parentOptions = [],
	onSubmit,
	isSubmitting = false,
	className,
}: LocationFormProps) {
	const { data: departments = [] } = useDepartments();
	const { mutateAsync: createDepartment, isPending: isCreatingDept } =
		useCreateDepartment();

	const [isDeptDialogOpen, setIsDeptDialogOpen] = useState(false);
	const [newDeptName, setNewDeptName] = useState("");
	const [newDeptCode, setNewDeptCode] = useState("");
	const [createDeptError, setCreateDeptError] = useState("");

	const form = useForm<LocationFormValues>({
		resolver: zodResolver(locationFormSchema),
		defaultValues: {
			name: defaultValues?.name ?? "",
			locationNumber: defaultValues?.locationNumber ?? "",
			building: defaultValues?.building ?? "",
			type: defaultValues?.type ?? "building",
			parentId: defaultValues?.parent?.id ?? null,
			departmentId: defaultValues?.department?.id ?? null,
			capacity: defaultValues?.capacity ?? null,
			openTime: defaultValues?.openTime ?? null,
		},
	});

	const handleCreateDepartment = async () => {
		setCreateDeptError("");
		if (!newDeptName.trim() || !newDeptCode.trim()) {
			setCreateDeptError("Please fill in all fields.");
			return;
		}

		try {
			const newDept = await createDepartment({
				name: newDeptName.trim(),
				code: newDeptCode.trim(),
			});

			form.setValue("departmentId", newDept.id, { shouldValidate: true });
			setIsDeptDialogOpen(false);
			setNewDeptName("");
			setNewDeptCode("");
		} catch (err: any) {
			setCreateDeptError(err.message || "Failed to create department.");
		}
	};

	// Watch dynamic form states to derive reactive UI controls
	const selectedType = form.watch("type");
	const parentIdValue = form.watch("parentId");
	const isRoom = selectedType === "room";
	const isBuilding = selectedType === "building";

	// Lock building field if a parent exists since it must inherit the parent's building code
	const isBuildingLocked = !!parentIdValue && !isBuilding;

	// ── Submit Handler ─────────────────────────────────────────────────────────

	const handleSubmit = (values: LocationFormValues) => {
		const dto: CreateLocationDto = {
			name: values.name,
			locationNumber: values.locationNumber,
			building: values.building,
			type: values.type as LocationType,
			parent: values.parentId ? { id: values.parentId } : null,
			department:
				isRoom && values.departmentId ? { id: values.departmentId } : null,
			capacity: isRoom ? (values.capacity ?? undefined) : undefined,
			openTime: isRoom ? (values.openTime ?? undefined) : undefined,
		};
		onSubmit(dto);
	};

	// ── Render Layout ──────────────────────────────────────────────────────────

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(handleSubmit)}
				className={cn("space-y-4", className)}
			>
				{/* Location Type Selection */}
				<FormField
					control={form.control}
					name="type"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Type</FormLabel>
							<Select
								value={field.value}
								onValueChange={(val) => {
									field.onChange(val);
									// Dynamic cleanup: reset fields when structurally mutating location types
									form.setValue("parentId", null);

									if (val === "building") {
										form.setValue("building", "");
									}

									if (val !== "room") {
										form.setValue("departmentId", null);
										form.setValue("capacity", null);
										form.setValue("openTime", null);
									}
								}}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select location type" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="building">Building</SelectItem>
									<SelectItem value="floor">Floor</SelectItem>
									<SelectItem value="room">Room</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Parent Location Component (Hidden for top-level buildings) */}
				{!isBuilding && (
					<FormField
						control={form.control}
						name="parentId"
						render={({ field }) => {
							const allowedTypes = PARENT_TYPE_MAP[selectedType] ?? [];
							const filteredParents = parentOptions.filter((p) =>
								allowedTypes.includes(p.type),
							);
							const selectedParent = filteredParents.find(
								(p) => p.id === field.value,
							);

							// Inline helper to append contextual context for better UX clarity
							const formatParentLabel = (p: (typeof parentOptions)[0]) => {
								if (p.building) {
									return `${p.name} (Building ${p.building})`;
								}
								return p.name;
							};

							return (
								<FormItem>
									<FormLabel>Parent Location *</FormLabel>
									<Select
										value={field.value ?? "none"}
										onValueChange={(val) => {
											if (val === "none") {
												field.onChange(null);
												form.setValue("building", "");
												return;
											}
											field.onChange(val);

											// Data Inheritance: Automatically populate the building value from selected parent node
											const parent = filteredParents.find((p) => p.id === val);
											if (parent?.building) {
												form.setValue("building", parent.building, {
													shouldValidate: true,
												});
											}
										}}
									>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="None (top-level)">
													{selectedParent
														? formatParentLabel(selectedParent)
														: "None (top-level)"}
												</SelectValue>
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{/* Retain the fallback option for flexibility, Zod custom validation will catch illegal states */}
											<SelectItem value="none">None (top-level)</SelectItem>
											{filteredParents.length === 0 ? (
												<div className="px-2 py-4 text-center text-sm text-muted-foreground">
													No valid parent available.
												</div>
											) : (
												filteredParents.map((p) => (
													<SelectItem key={p.id} value={p.id}>
														{formatParentLabel(p)}
													</SelectItem>
												))
											)}
										</SelectContent>
									</Select>
									<FormDescription>
										{selectedType === "floor" && "Select a building as parent."}
										{selectedType === "room" &&
											"Select a floor or parent room."}
									</FormDescription>
									<FormMessage />
								</FormItem>
							);
						}}
					/>
				)}

				{/* Location Name Field */}
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Name *</FormLabel>
							<FormControl>
								<Input placeholder="Main Conference Room" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Location Number Identifier Field */}
				<FormField
					control={form.control}
					name="locationNumber"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Location Number *</FormLabel>
							<FormControl>
								<Input placeholder="A-01-01" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Building Code Identifier Field */}
				<FormField
					control={form.control}
					name="building"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Building Code *</FormLabel>
							<FormControl>
								<Input
									placeholder="A"
									{...field}
									disabled={isBuildingLocked}
									className={
										isBuildingLocked ? "bg-muted cursor-not-allowed" : ""
									}
								/>
							</FormControl>
							<FormDescription>
								{isBuildingLocked &&
									"Building is automatically inherited from the Parent Location."}
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Department Form Select Field (Conditional Room Requirement) */}
				{isRoom && (
					<FormField
						control={form.control}
						name="departmentId"
						render={({ field }) => {
							const selectedDept = departments.find(
								(d) => d.id === field.value,
							);

							return (
								<FormItem>
									<FormLabel>Department</FormLabel>
									<div className="flex gap-2 items-center">
										<Select
											value={field.value ?? "none"}
											onValueChange={(val) => {
												field.onChange(val === "none" ? null : val);
											}}
										>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Select a department">
														{selectedDept
															? `${selectedDept.name} (${selectedDept.code})`
															: "Select a department"}
													</SelectValue>
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="none">
													— None (Public Room) —
												</SelectItem>
												{departments.map((dept) => (
													<SelectItem key={dept.id} value={dept.id}>
														{dept.name} ({dept.code})
													</SelectItem>
												))}
											</SelectContent>
										</Select>

										<Dialog
											open={isDeptDialogOpen}
											onOpenChange={setIsDeptDialogOpen}
										>
											<DialogTrigger
												render={
													<Button
														type="button"
														size="sm"
														className="shrink-0 h-8 px-3 bg-green-800 text-white hover:bg-green-700 hover:text-white hover:cursor-pointer"
													>
														+ Add New
													</Button>
												}
											/>
											<DialogContent className="sm:max-w-[425px]">
												<DialogHeader>
													<DialogTitle>Create New Department</DialogTitle>
													<DialogDescription>
														Enter the department details below. Click save when
														finished.
													</DialogDescription>
												</DialogHeader>
												<div className="space-y-4 py-4">
													<div className="space-y-2">
														<label className="text-sm font-medium">
															Department Name *
														</label>
														<Input
															required
															placeholder="e.g. Information Technology"
															value={newDeptName}
															onChange={(e) => setNewDeptName(e.target.value)}
														/>
													</div>
													<div className="space-y-2">
														<label className="text-sm font-medium">
															Department Code *
														</label>
														<Input
															required
															placeholder="e.g. IT"
															value={newDeptCode}
															onChange={(e) => setNewDeptCode(e.target.value)}
														/>
													</div>
													{createDeptError && (
														<p className="text-sm text-red-500 font-medium">
															{createDeptError}
														</p>
													)}
													<DialogFooter>
														<Button
															type="button"
															variant="outline"
															onClick={() => setIsDeptDialogOpen(false)}
															disabled={isCreatingDept}
														>
															Cancel
														</Button>
														<Button
															type="button"
															onClick={(e) => {
																e.preventDefault();
																handleCreateDepartment();
															}}
															disabled={isCreatingDept}
														>
															{isCreatingDept ? "Saving..." : "Save"}
														</Button>
													</DialogFooter>
												</div>
											</DialogContent>
										</Dialog>
									</div>
									<FormMessage />
								</FormItem>
							);
						}}
					/>
				)}

				{/* Capacity Constraint Field (Conditional Room Requirement) */}
				{isRoom && (
					<FormField
						control={form.control}
						name="capacity"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Capacity</FormLabel>
								<FormControl>
									<Input
										type="number"
										min={1}
										placeholder="20"
										{...field}
										value={field.value ?? ""}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				)}

				{/* Operating Schedule / Open Time Field (Conditional Room Requirement) */}
				{isRoom && (
					<FormField
						control={form.control}
						name="openTime"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Open Time</FormLabel>
								<FormControl>
									<Input
										placeholder="Mon to Fri (9AM to 6PM)"
										{...field}
										value={field.value ?? ""}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				)}

				{/* Global Submit Control Trigger */}
				<Button
					type="submit"
					disabled={isSubmitting}
					className="w-full sm:w-auto"
				>
					{isSubmitting ? "Saving..." : "Save Location"}
				</Button>
			</form>
		</Form>
	);
}

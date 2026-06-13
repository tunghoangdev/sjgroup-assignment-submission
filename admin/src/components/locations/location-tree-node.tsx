"use client";

import {
	Building,
	ChevronDown,
	ChevronRight,
	DoorClosed,
	Layers,
	MapPin,
	MoreHorizontal,
	Pencil,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Location } from "@/types/location.types";

const TYPE_ICONS: Record<
	string,
	React.ComponentType<{ className?: string }>
> = {
	building: Building,
	floor: Layers,
	room: DoorClosed,
	other: MapPin,
};

interface LocationTreeNodeProps {
	location: Location;
	depth: number;
}

export function LocationTreeNode({ location, depth }: LocationTreeNodeProps) {
	const [expanded, setExpanded] = useState(depth < 1);
	const hasChildren = location.children && location.children.length > 0;
	const Icon = TYPE_ICONS[location.type] ?? MapPin;

	return (
		<div>
			<div
				className={cn(
					"flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent/50 transition-colors group",
				)}
				style={{ paddingLeft: `${depth * 16 + 12}px` }}
			>
				{/* Expand/Collapse toggle */}
				<button
					type="button"
					onClick={() => setExpanded(!expanded)}
					className={cn(
						"flex h-5 w-5 items-center justify-center rounded hover:bg-accent",
						!hasChildren && "invisible",
					)}
					aria-label={expanded ? "Collapse" : "Expand"}
				>
					{expanded ? (
						<ChevronDown className="h-3.5 w-3.5" />
					) : (
						<ChevronRight className="h-3.5 w-3.5" />
					)}
				</button>

				{/* Icon + Name */}
				<Link
					href={`/locations/${location.id}`}
					className="flex items-center gap-2 flex-1 min-w-0"
				>
					<Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
					<span className="text-sm font-medium truncate">{location.name}</span>
					<Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
						{location.locationNumber}
					</Badge>
					{location.capacity != null && (
						<span className="text-xs text-muted-foreground shrink-0">
							{location.capacity} pax
						</span>
					)}
					{location.openTime && (
						<span className="text-xs text-muted-foreground shrink-0 border-l pl-2 ml-1 border-border">
							{location.openTime}
						</span>
					)}
					{location.department && (
						<Badge
							variant="secondary"
							className="text-[10px] px-1.5 py-0 shrink-0 ml-1"
						>
							{typeof location.department === "object"
								? (location.department as any).code ||
									(location.department as any).name
								: location.department}
						</Badge>
					)}
				</Link>

				{/* Actions */}
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
							onClick={(e) => e.stopPropagation()}
						/>
					}
				>
					<MoreHorizontal className="size-5 rounded-full" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem
						render={
							<Link
								href={`/locations/${location.id}`}
								className="cursor-pointer"
							/>
						}
					>
						<Pencil className="h-3.5 w-3.5 mr-2" />
						Edit
					</DropdownMenuItem>
					<DropdownMenuItem
						render={
							<Link
								href={`/locations/${location.id}?action=delete`}
								className="cursor-pointer text-destructive"
							/>
						}
					>
						<Trash2 className="h-3.5 w-3.5 mr-2" />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			</div>

			{/* Children */}
			{hasChildren && expanded && (
				<div>
					{location.children!.map((child) => (
						<LocationTreeNode
							key={child.id}
							location={child}
							depth={depth + 1}
						/>
					))}
				</div>
			)}
		</div>
	);
}

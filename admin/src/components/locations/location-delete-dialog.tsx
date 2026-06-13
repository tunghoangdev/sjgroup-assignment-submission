"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LocationDeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	locationName?: string;
	onConfirm: () => void;
	isDeleting?: boolean;
}

export function LocationDeleteDialog({
	open,
	onOpenChange,
	locationName = "this location",
	onConfirm,
	isDeleting = false,
}: LocationDeleteDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Location</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete <strong>{locationName}</strong>?
						This action cannot be undone. All child locations will also be
						removed.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						disabled={isDeleting}
						className="bg-destructive text-white hover:bg-destructive/90"
					>
						{isDeleting ? "Deleting..." : "Delete"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

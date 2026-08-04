import { useTransition } from "react"

import { Button } from "@packages/ui/components/button"
import {
	ResponsiveDialog,
	ResponsiveDialogClose,
	ResponsiveDialogContent,
	ResponsiveDialogDescription,
	ResponsiveDialogFooter,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
} from "@packages/ui/components/responsive-dialog"
import { action, capitalize } from "@/lib/utils"
import { deleteTagFn, type TagWithStats } from "@/server/expenses"

interface Props {
	tag: TagWithStats
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function DeleteTagDialog({ tag, open, onOpenChange }: Props) {
	const [isPending, startTransition] = useTransition()

	function confirmDelete() {
		startTransition(async () => {
			await action(
				"delete-tag",
				async () => {
					await deleteTagFn({ data: { name: tag.name } })
					onOpenChange(false)
				},
				{ loading: "Deleting tag…", success: "Tag removed" },
			)
		})
	}

	return (
		<ResponsiveDialog open={open} onOpenChange={onOpenChange}>
			<ResponsiveDialogContent>
				<ResponsiveDialogHeader>
					<ResponsiveDialogTitle>Delete tag</ResponsiveDialogTitle>
					<ResponsiveDialogDescription>
						Remove <span className="font-medium text-foreground">{capitalize(tag.name)}</span> from
						the registry. This only works when no expenses use this tag.
					</ResponsiveDialogDescription>
				</ResponsiveDialogHeader>
				<ResponsiveDialogFooter>
					<ResponsiveDialogClose asChild>
						<Button variant="ghost" disabled={isPending}>
							Cancel
						</Button>
					</ResponsiveDialogClose>
					<Button variant="destructive" disabled={isPending} onClick={confirmDelete}>
						Delete
					</Button>
				</ResponsiveDialogFooter>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	)
}

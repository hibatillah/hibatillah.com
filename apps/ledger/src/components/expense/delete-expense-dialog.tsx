import { format, parseISO } from "date-fns"
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
import { action, formatIDR } from "@/lib/utils"
import { deleteExpenseFn } from "@/server/expenses"

import type { Expense } from "./edit-expense-dialog"

interface Props {
	expense: Expense
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function DeleteExpenseDialog({ expense, open, onOpenChange }: Props) {
	const [isPending, startTransition] = useTransition()

	function handleDelete() {
		startTransition(async () => {
			await action(
				"delete-expense",
				async () => {
					await deleteExpenseFn({ data: { id: expense.id } })
					onOpenChange(false)
				},
				{ loading: "Deleting expense…", success: "Expense deleted" },
			)
		})
	}

	return (
		<ResponsiveDialog open={open} onOpenChange={onOpenChange}>
			<ResponsiveDialogContent>
				<ResponsiveDialogHeader>
					<ResponsiveDialogTitle>Delete expense</ResponsiveDialogTitle>
					<ResponsiveDialogDescription>
						Delete {formatIDR(expense.amount)} on {format(parseISO(expense.date), "MMM d, yyyy")}?
						This cannot be undone.
					</ResponsiveDialogDescription>
				</ResponsiveDialogHeader>
				<ResponsiveDialogFooter>
					<ResponsiveDialogClose asChild>
						<Button variant="ghost" disabled={isPending}>
							Cancel
						</Button>
					</ResponsiveDialogClose>
					<Button variant="destructive" disabled={isPending} onClick={handleDelete}>
						{isPending ? "Deleting…" : "Delete"}
					</Button>
				</ResponsiveDialogFooter>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	)
}

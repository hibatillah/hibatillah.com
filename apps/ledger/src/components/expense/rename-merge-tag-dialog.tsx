import { useForm } from "@tanstack/react-form"
import { useEffect } from "react"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@packages/ui/components/button"
import { Field, FieldError, FieldLabel } from "@packages/ui/components/field"
import { Input } from "@/components/ui/input"
import {
	ResponsiveDialog,
	ResponsiveDialogClose,
	ResponsiveDialogContent,
	ResponsiveDialogDescription,
	ResponsiveDialogFooter,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
} from "@packages/ui/components/responsive-dialog"
import { formatValidatorIssue } from "@/lib/form-errors"
import { action, capitalize } from "@/lib/utils"
import { renameOrMergeTagFn, type TagWithStats } from "@/server/expenses"

const renameSchema = z.object({
	newName: z.string().min(1, "Enter a name"),
})

interface Props {
	tag: TagWithStats
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function RenameMergeTagDialog({ tag, open, onOpenChange }: Props) {
	const form = useForm({
		defaultValues: { newName: tag.name },
		validators: { onSubmit: renameSchema },
		onSubmit: async ({ value }) => {
			const to = value.newName.trim()

			if (!to) return
			if (to === tag.name) {
				toast.message("Name unchanged")
				onOpenChange(false)
				return
			}

			await action(
				"rename-tag",
				async () => {
					await renameOrMergeTagFn({ data: { from: tag.name, to } })
					onOpenChange(false)
				},
				{
					loading: "Updating tag…",
					success: `Tag updated — expenses now use "${capitalize(to)}"`,
				},
			)
		},
	})

	useEffect(() => {
		if (!open) form.reset()
	}, [open, form])

	return (
		<ResponsiveDialog open={open} onOpenChange={onOpenChange}>
			<ResponsiveDialogContent>
				<ResponsiveDialogHeader>
					<ResponsiveDialogTitle>Rename or merge tag</ResponsiveDialogTitle>
					<ResponsiveDialogDescription>
						New name for <span className="font-medium text-foreground">{capitalize(tag.name)}</span>
						. If a tag with that name already exists, all expenses using this tag are merged into
						it; the existing tag keeps its color.
					</ResponsiveDialogDescription>
				</ResponsiveDialogHeader>

				<form
					id="rename-tag-form"
					className="flex flex-col gap-4 py-2"
					onSubmit={(e) => {
						e.preventDefault()
						form.handleSubmit()
					}}
				>
					<form.Field name="newName">
						{(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>New name</FieldLabel>
								<Input
									id={field.name}
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
									autoComplete="off"
								/>
								{field.state.meta.errors.length > 0 && (
									<FieldError
										errors={field.state.meta.errors.map((e) => ({
											message: formatValidatorIssue(e),
										}))}
									/>
								)}
							</Field>
						)}
					</form.Field>
				</form>

				<ResponsiveDialogFooter>
					<ResponsiveDialogClose asChild>
						<Button variant="ghost">Cancel</Button>
					</ResponsiveDialogClose>
					<form.Subscribe selector={(s) => s.isSubmitting}>
						{(isSubmitting) => (
							<Button type="submit" form="rename-tag-form" disabled={isSubmitting}>
								Apply
							</Button>
						)}
					</form.Subscribe>
				</ResponsiveDialogFooter>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	)
}

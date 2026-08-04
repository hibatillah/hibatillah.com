import { useForm } from "@tanstack/react-form"
import { useEffect } from "react"
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
import { TAG_COLOR_OPTIONS } from "@/lib/tag-palette"
import { action, capitalize, cn } from "@/lib/utils"
import { updateTagColorFn } from "@/server/expenses"

const schema = z.object({
	name: z.string().min(1, "Enter a name"),
	color: z.string().min(1, "Pick a color"),
})

interface Props {
	open: boolean
	onOpenChange: (open: boolean) => void
	existingTagNames: string[]
}

export function CreateTagDialog({ open, onOpenChange, existingTagNames }: Props) {
	const form = useForm({
		defaultValues: {
			name: "",
			color: TAG_COLOR_OPTIONS[0].color,
		},
		validators: {
			onSubmit: schema.superRefine((value, ctx) => {
				const trimmed = value.name.trim().toLowerCase()
				const exists = existingTagNames.some((t) => t.toLowerCase() === trimmed)
				if (exists) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						path: ["name"],
						message: "Tag already exists",
					})
				}
			}),
		},
		onSubmit: async ({ value }) => {
			const name = value.name.trim()
			await action(
				"create-tag",
				async () => {
					await updateTagColorFn({ data: { tag: name, color: value.color } })
					onOpenChange(false)
				},
				{
					loading: "Creating tag…",
					success: `Tag "${capitalize(name)}" created`,
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
					<ResponsiveDialogTitle>Create tag</ResponsiveDialogTitle>
					<ResponsiveDialogDescription>
						Add a new tag with a custom color. It will appear in the tag picker for expenses.
					</ResponsiveDialogDescription>
				</ResponsiveDialogHeader>

				<form
					id="create-tag-form"
					className="flex flex-col gap-4 py-2"
					onSubmit={(e) => {
						e.preventDefault()
						form.handleSubmit()
					}}
				>
					<form.Field name="name">
						{(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Name</FieldLabel>
								<Input
									id={field.name}
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
									autoComplete="off"
									placeholder="e.g. groceries"
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

					<form.Field name="color">
						{(field) => (
							<Field>
								<FieldLabel>Color</FieldLabel>
								<div className="flex flex-wrap gap-2">
									{TAG_COLOR_OPTIONS.map(({ color, label }) => {
										const selected = field.state.value === color
										return (
											<button
												key={color}
												type="button"
												title={label}
												aria-label={label}
												aria-pressed={selected}
												onClick={() => field.handleChange(color)}
												className={cn(
													"size-7 rounded-md border border-border transition",
													selected && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
												)}
												style={{ backgroundColor: color }}
											/>
										)
									})}
								</div>
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
							<Button type="submit" form="create-tag-form" disabled={isSubmitting}>
								Create
							</Button>
						)}
					</form.Subscribe>
				</ResponsiveDialogFooter>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	)
}

import { useForm } from "@tanstack/react-form"
import { z } from "zod"

import { Button } from "@packages/ui/components/button"
import { Field, FieldError, FieldLabel } from "@packages/ui/components/field"
import { Input } from "@/components/ui/input"
import {
	ResponsiveDialog,
	ResponsiveDialogContent,
	ResponsiveDialogDescription,
	ResponsiveDialogFooter,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
} from "@packages/ui/components/responsive-dialog"
import { useIsMobile } from "@/hooks/use-mobile"
import { authClient } from "@/lib/auth/client"
import { action } from "@/lib/utils"

const schema = z.object({
	name: z.string().max(100, "Name must be 100 characters or fewer"),
})

interface Props {
	open: boolean
	onOpenChange: (open: boolean) => void
	defaultName: string
	passkeyId: string
}

export function EditPasskeyDialog({ open, onOpenChange, defaultName, passkeyId }: Props) {
	const isMobile = useIsMobile()

	const form = useForm({
		defaultValues: { name: defaultName },
		validators: { onSubmit: schema },
		onSubmit: async ({ value }) => {
			await action(
				"rename-passkey",
				async () => {
					const { error } = await authClient.passkey.updatePasskey({
						id: passkeyId,
						name: value.name.trim(),
					})

					if (error) {
						console.error(error)
						throw new Error("Failed to rename passkey. Try again.")
					}

					onOpenChange(false)
				},
				{ loading: "Renaming passkey…", success: "Passkey renamed." },
			)
		},
	})

	return (
		<ResponsiveDialog open={open} onOpenChange={onOpenChange}>
			<ResponsiveDialogContent showCloseButton={false}>
				<ResponsiveDialogHeader>
					<ResponsiveDialogTitle>Rename passkey</ResponsiveDialogTitle>
					<ResponsiveDialogDescription>
						Update the display name for this passkey.
					</ResponsiveDialogDescription>
				</ResponsiveDialogHeader>

				<form
					id="edit-passkey-form"
					className="py-1"
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
									placeholder="e.g. Personal MacBook"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
									autoFocus
								/>
								{field.state.meta.errors.length > 0 && (
									<FieldError
										errors={field.state.meta.errors.map((e) => ({
											message: String(e),
										}))}
									/>
								)}
							</Field>
						)}
					</form.Field>
				</form>

				<ResponsiveDialogFooter>
					<Button variant={isMobile ? "secondary" : "ghost"} onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<form.Subscribe selector={(s) => s.isSubmitting}>
						{(isSubmitting) => (
							<Button
								type="submit"
								form="edit-passkey-form"
								disabled={isSubmitting}
								className="w-full sm:w-fit"
							>
								{isSubmitting ? "Saving…" : "Save"}
							</Button>
						)}
					</form.Subscribe>
				</ResponsiveDialogFooter>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	)
}

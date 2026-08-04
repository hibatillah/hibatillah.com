import { useForm } from "@tanstack/react-form"
import { KeyRoundIcon } from "lucide-react"
import { useEffect, useState } from "react"
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
	ResponsiveDialogTrigger,
} from "@packages/ui/components/responsive-dialog"
import { useIsMobile } from "@/hooks/use-mobile"
import { authClient } from "@/lib/auth/client"
import { action } from "@/lib/utils"

const schema = z.object({
	name: z.string().max(100, "Name must be 100 characters or fewer"),
})

interface Props {
	open?: boolean
	onOpenChange?: (open: boolean) => void
}

export function AddPasskeyDialog({ open: openProp, onOpenChange }: Props = {}) {
	const isMobile = useIsMobile()
	const [internalOpen, setInternalOpen] = useState(false)
	const open = openProp !== undefined ? openProp : internalOpen
	const setOpen = onOpenChange ?? setInternalOpen
	const isControlled = openProp !== undefined

	const form = useForm({
		defaultValues: { name: "" },
		validators: { onSubmit: schema },
		onSubmit: async ({ value }) => {
			await action(
				"add-passkey",
				async () => {
					const { error } = await authClient.passkey.addPasskey({
						name: value.name.trim() || undefined,
					})

					if (error) {
						console.error(error)
						throw new Error("Registration failed. Try again.")
					}

					setOpen(false)
				},
				{ loading: "Waiting for device…", success: "Passkey registered." },
			)
		},
	})

	useEffect(() => {
		if (!open) form.reset()
	}, [open, form])

	return (
		<ResponsiveDialog open={open} onOpenChange={setOpen}>
			{!isControlled && (
				<ResponsiveDialogTrigger asChild>
					<Button size="sm" variant="default">
						<KeyRoundIcon />
						Add new passkey
					</Button>
				</ResponsiveDialogTrigger>
			)}

			<ResponsiveDialogContent>
				<ResponsiveDialogHeader>
					<ResponsiveDialogTitle>Register new passkey</ResponsiveDialogTitle>
					<ResponsiveDialogDescription>
						Give a name to easily identify passkeys.
					</ResponsiveDialogDescription>
				</ResponsiveDialogHeader>

				<form
					id="add-passkey-form"
					className="py-1"
					onSubmit={(e) => {
						e.preventDefault()
						form.handleSubmit()
					}}
				>
					<form.Field name="name">
						{(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Name (optional)</FieldLabel>
								<Input
									id={field.name}
									placeholder="e.g. Work laptop — Chrome"
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
					<ResponsiveDialogClose asChild>
						<Button variant={isMobile ? "secondary" : "ghost"}>Cancel</Button>
					</ResponsiveDialogClose>
					<form.Subscribe selector={(s) => s.isSubmitting}>
						{(isSubmitting) => (
							<Button
								type="submit"
								form="add-passkey-form"
								className="w-full sm:w-fit"
								disabled={isSubmitting}
							>
								{isSubmitting ? "Waiting for device…" : "Register passkey"}
							</Button>
						)}
					</form.Subscribe>
				</ResponsiveDialogFooter>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	)
}

import { Trash2Icon } from "lucide-react"
import { useTransition } from "react"

import { Button } from "@packages/ui/components/button"
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

interface Props {
	open: boolean
	onOpenChange: (open: boolean) => void
	passkeyId: string
	passkeyName?: string | null
}

export function DeletePasskeyDialog({ open, onOpenChange, passkeyId, passkeyName }: Props) {
	const isMobile = useIsMobile()
	const [isPending, startTransition] = useTransition()

	function handleDelete() {
		startTransition(async () => {
			await action(
				"delete-passkey",
				async () => {
					const { error } = await authClient.passkey.deletePasskey({
						id: passkeyId,
					})

					if (error) {
						console.error(error)
						throw new Error("Failed to remove passkey. Try again.")
					}

					onOpenChange(false)
				},
				{ loading: "Removing passkey…", success: "Passkey removed." },
			)
		})
	}

	return (
		<ResponsiveDialog open={open} onOpenChange={onOpenChange}>
			<ResponsiveDialogContent>
				<ResponsiveDialogHeader>
					<ResponsiveDialogTitle>Remove passkey?</ResponsiveDialogTitle>
					<ResponsiveDialogDescription>
						{passkeyName ? (
							<>
								<span className="font-medium text-foreground">{passkeyName}</span> will be
								permanently removed. You won't be able to use it to sign in.
							</>
						) : (
							"This passkey will be permanently removed. You won't be able to use it to sign in."
						)}
					</ResponsiveDialogDescription>
				</ResponsiveDialogHeader>

				<ResponsiveDialogFooter>
					<Button variant={isMobile ? "secondary" : "ghost"} onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={isPending}
						className="w-full sm:w-28"
					>
						<Trash2Icon />
						{isPending ? "Removing…" : "Remove"}
					</Button>
				</ResponsiveDialogFooter>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	)
}

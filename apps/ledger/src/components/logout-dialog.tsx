import { PowerIcon } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@packages/ui/components/button"
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
import { action, cn } from "@/lib/utils"

interface Props {
	onSuccess: () => void
	className?: string
	open?: boolean
	onOpenChange?: (open: boolean) => void
}

export function LogoutDialog({ onSuccess, className, open, onOpenChange }: Props) {
	const isMobile = useIsMobile()
	const [isPending, startTransition] = useTransition()

	function handleLogout() {
		startTransition(async () => {
			try {
				await action(
					"logout",
					async () => {
						await authClient.signOut()
					},
					{ loading: "Signing off…", success: "Signed off." },
				)
				onSuccess()
			} catch (error) {
				console.log("Logout Failed: ", error)
				toast.error("Failed to logout")
			}
		})
	}

	return (
		<ResponsiveDialog open={open} onOpenChange={onOpenChange}>
			<ResponsiveDialogTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="Sign off"
					className={cn(
						"text-muted-foreground hover:bg-destructive/10! hover:text-destructive focus-visible:text-destructive",
						className,
					)}
				>
					<PowerIcon className="size-4" />
				</Button>
			</ResponsiveDialogTrigger>

			<ResponsiveDialogContent showCloseButton={false}>
				<ResponsiveDialogHeader>
					<ResponsiveDialogTitle>Sign off?</ResponsiveDialogTitle>
					<ResponsiveDialogDescription>
						You'll need your passkey to sign back in.
					</ResponsiveDialogDescription>
				</ResponsiveDialogHeader>

				<ResponsiveDialogFooter>
					<ResponsiveDialogClose asChild>
						<Button variant={isMobile ? "secondary" : "ghost"}>Cancel</Button>
					</ResponsiveDialogClose>
					<Button
						variant="destructive"
						disabled={isPending}
						onClick={handleLogout}
						className="w-full sm:w-32"
					>
						<PowerIcon />
						{isPending ? "Signing off…" : "Sign off"}
					</Button>
				</ResponsiveDialogFooter>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	)
}

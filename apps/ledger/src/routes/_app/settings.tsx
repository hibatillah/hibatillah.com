import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { MonitorSmartphoneIcon, PencilIcon, ShieldCheckIcon, Trash2Icon } from "lucide-react"
import { useState, useTransition } from "react"

import { AddPasskeyDialog } from "@/components/passkey/add-passkey-dialog"
import { DeletePasskeyDialog } from "@/components/passkey/delete-passkey-dialog"
import { EditPasskeyDialog } from "@/components/passkey/edit-passkey-dialog"
import { Button } from "@packages/ui/components/button"
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@packages/ui/components/item"
import { Skeleton } from "@packages/ui/components/skeleton"
import { Switch } from "@packages/ui/components/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from "@packages/ui/components/tooltip"
import { action } from "@/lib/utils"
import { getPasskeysFn } from "@/server/passkeys"
import { getSettingsFn, updateSettingsFn } from "@/server/settings"

export const Route = createFileRoute("/_app/settings")({
	loader: () => getSettingsFn(),
	component: SettingsPage,
	head: () => ({
		meta: [{ title: "Settings | Hibatillah's Ledger" }],
	}),
})

function PasskeySection() {
	const { data: passkeys = [], isPending: loading } = useQuery({
		queryKey: ["passkeys"],
		queryFn: () => getPasskeysFn(),
	})

	const [editingKey, setEditingKey] = useState<(typeof passkeys)[number] | null>(null)
	const [deletingKey, setDeletingKey] = useState<(typeof passkeys)[number] | null>(null)

	function formatDate(date: string | Date | null | undefined) {
		if (!date) return "—"
		const d = new Date(date)
		if (isNaN(d.getTime())) return "—"
		return `${format(d, "d MMM yyyy, HH:mm", { locale: id })} WIB`
	}

	return (
		<>
			<div className="space-y-3">
				<div className="flex items-end justify-between gap-4">
					<div>
						<h2 className="text-base font-medium">Passkeys</h2>
						<p className="text-sm text-muted-foreground">Manage registered passkeys</p>
					</div>
					<AddPasskeyDialog />
				</div>

				{loading ? (
					<ItemGroup className="h-32 rounded-xl bg-card p-2">
						<PasskeySkeleton />
						<PasskeySkeleton />
					</ItemGroup>
				) : passkeys.length === 0 ? (
					<ItemGroup className="flex h-32 items-center justify-center rounded-xl bg-card p-2">
						<p className="py-2 text-center text-sm text-muted-foreground">
							No passkeys registered. Add one above.
						</p>
					</ItemGroup>
				) : (
					<ItemGroup className="gap-1 rounded-xl bg-card p-2">
						{passkeys.map((key) => (
							<Item key={key.id} className="relative items-start hover:bg-muted/50 sm:items-center">
								<ItemContent className="flex-col gap-1 sm:flex-row sm:gap-4">
									<ItemTitle>{key.name ?? "Unnamed passkey"}</ItemTitle>
									<ItemDescription className="flex flex-wrap items-center gap-x-2 sm:gap-x-3">
										<span className="max-sm:w-full">Added {formatDate(key.createdAt)}</span>
										{key.deviceType === "multiDevice" && (
											<Tooltip>
												<TooltipTrigger className="flex items-center gap-1">
													<MonitorSmartphoneIcon className="size-4" />
													<span className="sm:sr-only">Synced across devices</span>
												</TooltipTrigger>
												<TooltipContent>Synced across devices</TooltipContent>
											</Tooltip>
										)}
										{key.backedUp && (
											<Tooltip>
												<TooltipTrigger className="flex items-center gap-1">
													<ShieldCheckIcon className="size-4" />
													<span className="sm:sr-only">Backed up</span>
												</TooltipTrigger>
												<TooltipContent>Backed up</TooltipContent>
											</Tooltip>
										)}
									</ItemDescription>
								</ItemContent>
								<ItemActions className="absolute top-1 right-1 gap-0 transition-opacity sm:block lg:opacity-0 lg:group-hover/item:opacity-100 lg:has-focus-visible:opacity-100">
									<Button
										variant="ghost"
										size="icon"
										aria-label={`Rename ${key.name ?? `passkey`}`}
										onClick={() => setEditingKey(key)}
										className="hit-area-y-1.5 hit-area-l-2 hit-area-r-0"
									>
										<PencilIcon />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										aria-label={`Remove ${key.name ?? `passkey`}`}
										onClick={() => setDeletingKey(key)}
										className="hit-area-y-1.5 hit-area-l-0 hit-area-r-2"
									>
										<Trash2Icon />
									</Button>
								</ItemActions>
							</Item>
						))}
					</ItemGroup>
				)}
			</div>

			<EditPasskeyDialog
				key={editingKey?.id ?? "none"}
				open={!!editingKey}
				onOpenChange={(open) => {
					if (!open) setEditingKey(null)
				}}
				passkeyId={editingKey?.id ?? ""}
				defaultName={editingKey?.name ?? ""}
			/>

			<DeletePasskeyDialog
				open={!!deletingKey}
				onOpenChange={(open) => {
					if (!open) setDeletingKey(null)
				}}
				passkeyId={deletingKey?.id ?? ""}
				passkeyName={deletingKey?.name}
			/>
		</>
	)
}

function PasskeySkeleton() {
	return (
		<Item>
			<ItemMedia variant="icon">
				<Skeleton className="size-4 rounded" />
			</ItemMedia>
			<ItemContent>
				<Skeleton className="h-3.5 w-40 rounded" />
				<Skeleton className="h-3 w-24 rounded" />
			</ItemContent>
		</Item>
	)
}

function AuthSection() {
	const { googleAuthEnabled } = Route.useLoaderData()
	const [enabled, setEnabled] = useState(googleAuthEnabled)
	const [isSaving, startTransition] = useTransition()

	function mutate(value: boolean) {
		startTransition(async () => {
			try {
				await action(
					"settings-google",
					async () => {
						await updateSettingsFn({ data: { googleAuthEnabled: value } })
					},
					{ loading: "Saving…", success: "Settings saved" },
				)
				setEnabled(value)
			} catch {
				// error handled by action()
			}
		})
	}

	return (
		<div className="space-y-3">
			<div>
				<h2 className="text-base font-medium">Authentication</h2>
				<p className="text-sm text-muted-foreground">Manage sign-in options</p>
			</div>

			<ItemGroup className="rounded-xl bg-card p-2">
				<Item
					className="cursor-pointer hover:bg-muted/50"
					render={<label htmlFor="google-signin-toggle" />}
				>
					<ItemContent className="gap-0">
						<ItemTitle>Google sign-in</ItemTitle>
						<ItemDescription>Enable sign in with google option</ItemDescription>
					</ItemContent>
					<ItemActions>
						<Switch
							id="google-signin-toggle"
							checked={enabled}
							onCheckedChange={mutate}
							disabled={isSaving}
						/>
					</ItemActions>
				</Item>
			</ItemGroup>
		</div>
	)
}

function SettingsPage() {
	return (
		<main className="container mx-auto max-w-2xl space-y-8 px-4 py-10">
			<AuthSection />
			<PasskeySection />
		</main>
	)
}

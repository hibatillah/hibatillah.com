import { createFileRoute, Outlet } from "@tanstack/react-router"
import { AlertCircleIcon } from "lucide-react"

import { Header } from "@/components/header"
import { Button } from "@packages/ui/components/button"
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty"
import { requireAuth } from "@/server/middleware"

export const Route = createFileRoute("/_app")({
	beforeLoad: ({ location }) => requireAuth(location.href),
	component: AppLayout,
	errorComponent: AppError,
})

function AppLayout() {
	return (
		<>
			<Header />
			<Outlet />
		</>
	)
}

function AppError({ error, reset }: { error: unknown; reset: () => void }) {
	const message = error instanceof Error ? error.message : "An unexpected error occurred."

	return (
		<main className="container mx-auto flex max-w-7xl flex-1 flex-col p-6">
			<Empty className="min-h-[60vh]">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<AlertCircleIcon />
					</EmptyMedia>
					<EmptyTitle className="text-2xl">Something went wrong</EmptyTitle>
					<EmptyDescription>{message}</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Button variant="outline" size="sm" onClick={reset}>
						Try again
					</Button>
					<Button variant="ghost" size="sm" onClick={() => window.location.assign("/")}>
						Go to dashboard
					</Button>
				</EmptyContent>
			</Empty>
		</main>
	)
}

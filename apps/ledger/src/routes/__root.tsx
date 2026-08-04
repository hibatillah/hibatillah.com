import { TanStackDevtools } from "@tanstack/react-devtools"
import { QueryClientProvider, useQuery } from "@tanstack/react-query"
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { AlertCircleIcon, FileSearchIcon } from "lucide-react"

import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@packages/ui/components/button"
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@packages/ui/components/tooltip"
import { queryClient } from "@/lib/query-client"
import { getSessionFn } from "@/server/auth"

import appCss from "../styles.css?url"

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Hibatillah's Ledger" },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "icon", href: "/icon.png", type: "image/png" },
		],
	}),
	shellComponent: RootDocument,
	notFoundComponent: RootNotFound,
	errorComponent: RootError,
})

const THEME_SCRIPT =
	`(function(){try{var t=localStorage.getItem("ui-theme");var d=t==="dark"||t==="light"?t:window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.classList.add(d)}catch(e){}})()` as const

function useHasSession() {
	const { data } = useQuery({
		queryKey: ["session"],
		queryFn: () => getSessionFn(),
		retry: false,
	})

	return !!data
}

function RootNotFound() {
	const hasSession = useHasSession()

	return (
		<main className="container mx-auto flex max-w-7xl flex-1 flex-col p-6">
			<Empty className="min-h-[60vh]">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<FileSearchIcon />
					</EmptyMedia>
					<EmptyTitle className="text-2xl">Page not found</EmptyTitle>
					<EmptyDescription>
						The page you're looking for doesn't exist or has been moved.
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					{hasSession ? (
						<Button variant="outline" size="sm" onClick={() => window.location.assign("/")}>
							Go to dashboard
						</Button>
					) : (
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								window.location.assign(
									`https://auth.hibatillah.com/login?redirect=${encodeURIComponent(window.location.href)}`,
								)
							}
						>
							Go to login
						</Button>
					)}
				</EmptyContent>
			</Empty>
		</main>
	)
}

function RootError({ error, reset }: { error: unknown; reset: () => void }) {
	const hasSession = useHasSession()
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
					{hasSession ? (
						<Button variant="ghost" size="sm" onClick={() => window.location.assign("/")}>
							Go to dashboard
						</Button>
					) : (
						<Button
							variant="ghost"
							size="sm"
							onClick={() =>
								window.location.assign(
									`https://auth.hibatillah.com/login?redirect=${encodeURIComponent(window.location.href)}`,
								)
							}
						>
							Go to login
						</Button>
					)}
				</EmptyContent>
			</Empty>
		</main>
	)
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
				<script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
			</head>
			<body>
				<QueryClientProvider client={queryClient}>
					<ThemeProvider defaultTheme="system">
						<TooltipProvider>{children}</TooltipProvider>
					</ThemeProvider>
				</QueryClientProvider>
				<TanStackDevtools
					config={{ position: "bottom-right", hideUntilHover: true }}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Toaster />
				<Scripts />
			</body>
		</html>
	)
}

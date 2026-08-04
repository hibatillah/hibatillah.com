import { useHotkeys } from "@tanstack/react-hotkeys"
import { Link, useNavigate } from "@tanstack/react-router"
import { MoonIcon, SunIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { LogoutDialog } from "@/components/logout-dialog"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@packages/ui/components/button"
import { Kbd } from "@packages/ui/components/kbd"
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
} from "@packages/ui/components/navigation-menu"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@packages/ui/components/tooltip"
import { cn } from "@/lib/utils"

function ThemeToggle({
	isDark,
	onToggle,
	className,
}: {
	isDark: boolean
	onToggle: () => void
	className?: string
}) {
	const [mounted, setMounted] = useState(false)
	useEffect(() => setMounted(true), [])

	return (
		<Button
			variant="ghost"
			size="icon-sm"
			aria-label={
				mounted ? (isDark ? "Switch to light mode" : "Switch to dark mode") : "Toggle theme"
			}
			className={cn("text-muted-foreground focus-visible:text-foreground", className)}
			onClick={onToggle}
		>
			{mounted ? (
				isDark ? (
					<SunIcon className="size-4" />
				) : (
					<MoonIcon className="size-4" />
				)
			) : (
				<MoonIcon className="size-4" />
			)}
		</Button>
	)
}

export function Header() {
	const navigate = useNavigate()
	const { theme, setTheme } = useTheme()
	const [signOutOpen, setSignOutOpen] = useState(false)

	const isDarkGlobal = useMemo(
		() =>
			theme === "dark" ||
			(theme === "system" &&
				typeof window !== "undefined" &&
				window.matchMedia("(prefers-color-scheme: dark)").matches),
		[theme],
	)

	useHotkeys(
		[
			{ hotkey: "Control+1", callback: () => navigate({ to: "/" }) },
			{ hotkey: "Control+2", callback: () => navigate({ to: "/settings" }) },
			{
				hotkey: "Shift+A",
				callback: () => setTheme(isDarkGlobal ? "light" : "dark"),
			},
			{
				hotkey: "Shift+S",
				callback: () => setSignOutOpen(true),
			},
		],
		{ preventDefault: true },
	)

	return (
		<header className="sticky top-0 z-20 w-full border-b bg-card/70 shadow-xs backdrop-blur-2xl backdrop-saturate-150">
			<div className="container mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2">
				<NavigationMenu>
					<NavigationMenuList className="**:data-[slot=tooltip-trigger]:hit-area-y-2 **:data-[slot=tooltip-trigger]:text-muted-foreground **:data-[slot=tooltip-trigger]:hover:text-foreground **:data-[slot=tooltip-trigger]:data-[status=active]:text-foreground">
						<TooltipProvider delay={500}>
							<NavigationMenuItem>
								<Tooltip>
									<TooltipTrigger
										render={
											<NavigationMenuLink render={<Link to="/" activeOptions={{ exact: true }} />}>
												Dashboard
											</NavigationMenuLink>
										}
									/>
									<TooltipContent>
										Dashboard <Kbd>Ctrl+1</Kbd>
									</TooltipContent>
								</Tooltip>
							</NavigationMenuItem>
							<NavigationMenuItem>
								<Tooltip>
									<TooltipTrigger
										render={
											<NavigationMenuLink render={<Link to="/settings" />}>
												Settings
											</NavigationMenuLink>
										}
									/>
									<TooltipContent>
										Settings <Kbd>Ctrl+2</Kbd>
									</TooltipContent>
								</Tooltip>
							</NavigationMenuItem>
						</TooltipProvider>
					</NavigationMenuList>
				</NavigationMenu>

				<div className="flex items-center gap-1">
					<Tooltip>
						<TooltipTrigger render={<span />}>
							<ThemeToggle
								isDark={isDarkGlobal}
								onToggle={() => setTheme(isDarkGlobal ? "light" : "dark")}
								className="hit-area-2 hit-area-r-0.5"
							/>
						</TooltipTrigger>
						<TooltipContent>
							Toggle theme
							<Kbd>Shift+A</Kbd>
						</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger render={<span />}>
							<LogoutDialog
								onSuccess={() => window.location.assign("https://auth.hibatillah.com/login")}
								className="hit-area-2 hit-area-l-0.5"
								open={signOutOpen}
								onOpenChange={setSignOutOpen}
							/>
						</TooltipTrigger>
						<TooltipContent>
							Sign off <Kbd>Shift+S</Kbd>
						</TooltipContent>
					</Tooltip>
				</div>
			</div>
		</header>
	)
}

import { ViewTransition } from "react"

/**
 * Wraps a page's content in the detail panel. Keyed per route so navigating
 * between details plays an exit/enter pair; the master panel never animates.
 * Must live in each page.tsx — layouts persist, so enter/exit never fire there.
 */
export function DetailTransition({
	routeKey,
	children,
}: {
	routeKey: string
	children: React.ReactNode
}) {
	return (
		<ViewTransition key={routeKey} enter="detail-enter" exit="detail-exit" default="none">
			<div className="flex flex-col gap-6 md:gap-12">{children}</div>
		</ViewTransition>
	)
}

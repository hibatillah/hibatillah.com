/**
 * Closes a sheet first, then runs `fn` after a short delay so the sheet can
 * unmount / exit before a ResponsiveDialog (or drawer) opens — avoids stacked
 * overlays and focus traps.
 */
export function closeSheetThen(
	setSheetOpen: (open: boolean) => void,
	fn: () => void,
	delayMs = 100,
) {
	setSheetOpen(false)
	window.setTimeout(fn, delayMs)
}

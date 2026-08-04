import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { DrawerContent, DrawerTitle } from "./drawer"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "./sheet"
import { useIsMobile } from "../../hooks/use-mobile"
import { cn } from "../../lib/utils"

// sm breakpoint — matches Tailwind's `sm:` (640px)
const MOBILE_BREAKPOINT = 640

interface ResponsiveSheetContextValue {
	isMobile: boolean
	open: boolean
	onOpenChange: (open: boolean) => void
}

const ResponsiveSheetContext = React.createContext<ResponsiveSheetContextValue>({
	isMobile: false,
	open: false,
	onOpenChange: () => {},
})

function useResponsiveSheet() {
	return React.useContext(ResponsiveSheetContext)
}

function ResponsiveSheet({
	open,
	onOpenChange,
	children,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	children: React.ReactNode
}) {
	const isMobile = useIsMobile(MOBILE_BREAKPOINT)
	const ctx = React.useMemo(
		() => ({ isMobile, open, onOpenChange }),
		[isMobile, open, onOpenChange],
	)

	return (
		<ResponsiveSheetContext.Provider value={ctx}>
			{isMobile ? (
				<DrawerPrimitive.Root open={open} onOpenChange={onOpenChange} noBodyStyles>
					{children}
				</DrawerPrimitive.Root>
			) : (
				<Sheet open={open} onOpenChange={onOpenChange}>
					{children}
				</Sheet>
			)}
		</ResponsiveSheetContext.Provider>
	)
}

/** Accepts the same `render` prop as `SheetTrigger`. On mobile, clones the
 *  element and wires an onClick that opens the sheet/drawer. */
function ResponsiveSheetTrigger({ render: renderProp }: { render: React.ReactElement }) {
	const { isMobile, onOpenChange } = useResponsiveSheet()

	if (isMobile) {
		const child = renderProp as React.ReactElement<{
			onClick?: (e: React.MouseEvent) => void
		}>
		return React.cloneElement(child, {
			onClick: (e: React.MouseEvent) => {
				child.props.onClick?.(e)
				onOpenChange(true)
			},
		})
	}

	return <SheetTrigger render={renderProp} />
}

/** On desktop: left `SheetContent`. On mobile: bottom `DrawerContent`. */
function ResponsiveSheetContent({
	className,
	sheetClassName,
	drawerClassName,
	showCloseButton,
	children,
}: {
	className?: string
	/** Extra classes applied only on desktop (Sheet). */
	sheetClassName?: string
	/** Extra classes applied only on mobile (Drawer). */
	drawerClassName?: string
	showCloseButton?: boolean
	children: React.ReactNode
}) {
	const { isMobile } = useResponsiveSheet()

	if (isMobile) {
		return (
			<DrawerContent className={cn("flex max-h-[90vh] flex-col", drawerClassName, className)}>
				{children}
			</DrawerContent>
		)
	}

	return (
		<SheetContent
			side="left"
			showCloseButton={showCloseButton}
			className={cn("data-[side=left]:max-w-none", sheetClassName, className)}
		>
			{children}
		</SheetContent>
	)
}

/** Renders `SheetTitle` on desktop and `DrawerTitle` on mobile for correct
 *  accessibility semantics. */
function ResponsiveSheetTitle({ className, ...props }: React.ComponentProps<"h2">) {
	const { isMobile } = useResponsiveSheet()

	if (isMobile) {
		return <DrawerTitle className={cn("text-lg", className)} {...props} />
	}

	return <SheetTitle className={cn("text-lg", className)} {...props} />
}

export {
	ResponsiveSheet,
	ResponsiveSheetContent,
	ResponsiveSheetTitle,
	ResponsiveSheetTrigger,
	useResponsiveSheet,
}

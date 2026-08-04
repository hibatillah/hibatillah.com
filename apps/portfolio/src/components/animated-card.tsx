"use client"

import {
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@packages/ui/components/card"
import { cn } from "@packages/ui/lib/utils"
import { motion, type HTMLMotionProps, type Transition } from "motion/react"
import * as React from "react"

const slideIn: Transition = {
	type: "spring",
	bounce: 0.2,
	duration: 0.6,
}

const fadeSlideUp: HTMLMotionProps<"div"> = {
	transition: slideIn,
	initial: { opacity: 0, y: 5 },
	animate: { opacity: 1, y: 0 },
}

/**
 * `Card` from `@packages/ui` with a mount fade-slide-up animation.
 * Portfolio-specific — ledger and other consumers get the plain, undecorated `Card`.
 */
function AnimatedCard({
	className,
	size = "default",
	...props
}: React.ComponentProps<typeof motion.div> & { size?: "default" | "sm" }) {
	return (
		<motion.div
			data-slot="card"
			data-size={size}
			{...fadeSlideUp}
			className={cn(
				"group/card flex flex-col gap-4 overflow-hidden rounded-xl bg-card py-4 text-sm text-card-foreground ring-1 ring-foreground/10 has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
				className,
			)}
			{...props}
		/>
	)
}

export { AnimatedCard, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle }

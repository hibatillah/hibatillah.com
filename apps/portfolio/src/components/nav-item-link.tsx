"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

/** `<Link>` that marks itself `aria-current="page"` when its href is the current route. */
export function NavItemLink({ href, ...props }: React.ComponentProps<typeof Link>) {
	const pathname = usePathname()
	const isCurrentPage = typeof href === "string" && pathname === href

	return <Link href={href} aria-current={isCurrentPage ? "page" : undefined} {...props} />
}

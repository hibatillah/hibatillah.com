import { clsx, type ClassValue } from "clsx"
import { toast } from "sonner"
import { twMerge } from "tailwind-merge"

import { queryClient } from "@/lib/query-client"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function capitalize(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1)
}

const idrFormatter = new Intl.NumberFormat("en-US", {
	notation: "compact",
	style: "currency",
	currency: "IDR",
	maximumFractionDigits: 3,
})

export function formatIDR(amount: number): string {
	return idrFormatter.format(amount)
}

export function toMs(d: string | Date | null | undefined): number {
	if (d == null) return Infinity
	const date = d instanceof Date ? d : new Date(d)
	return isNaN(date.getTime()) ? Infinity : date.getTime()
}

export type ActionMessage = {
	loading?: string
	success?: string
	/** Shown as description below the error message. */
	error?: string
}

function parseError(e: unknown): string {
	if (e instanceof Error) return e.message
	return String(e)
}

/**
 * Action runner with toast feedback.
 * Re-throws on error so callers can react if needed.
 *
 * @example
 * ```ts
 * await action(
 *   "logout",
 *   async () => {
 *     const { error } = await authClient.signOut()
 *     if (error) throw error
 *   },
 *   { loading: "Signing off…", success: "Signed off." }
 * )
 * ```
 */
export async function action(
	id: string,
	callback: () => Promise<void>,
	messages: ActionMessage = {},
): Promise<void> {
	const { loading = "Loading…", success = "Done", error: errDesc } = messages
	toast.loading(loading, { id })

	try {
		await callback()
		await queryClient.invalidateQueries()
		toast.success(success, { id })
	} catch (error) {
		console.error(`action:${id}`, parseError(error))
		toast.error(parseError(error), { id, description: errDesc })
		throw error
	}
}

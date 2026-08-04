import { format } from "date-fns"
import { useMemo } from "react"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@packages/ui/components/skeleton"
import { capitalize, formatIDR } from "@/lib/utils"

type ExpenseRow = { date: string; amount: number; tag: string }

export interface ExtraStats {
	streak: number
	mostExpensiveAmount: number
	mostExpensiveTag: string
	mostExpensiveDateFormatted: string
	topTag: string
	topTagTotal: number
	topTagPct: number
	weekendPct: number
}

export function useExtraStats(filtered: ExpenseRow[]): ExtraStats {
	return useMemo(() => {
		if (!filtered.length) {
			return {
				streak: 0,
				mostExpensiveAmount: 0,
				mostExpensiveTag: "—",
				mostExpensiveDateFormatted: "—",
				topTag: "—",
				topTagTotal: 0,
				topTagPct: 0,
				weekendPct: 0,
			}
		}

		// Streak: longest consecutive calendar days with ≥1 expense
		const days = [...new Set(filtered.map((e) => e.date.slice(0, 10)))].sort()
		let maxStreak = 1
		let streak = 1

		for (let i = 1; i < days.length; i++) {
			const [y1, m1, d1] = days[i - 1].split("-").map(Number)
			const [y2, m2, d2] = days[i].split("-").map(Number)
			const prevMs = new Date(y1, m1 - 1, d1).getTime()
			const currMs = new Date(y2, m2 - 1, d2).getTime()
			const diff = Math.round((currMs - prevMs) / 86400000)

			if (diff === 1) {
				streak++
				if (streak > maxStreak) maxStreak = streak
			} else {
				streak = 1
			}
		}

		// Most expensive single entry
		let mostExpensiveEntry = filtered[0]
		for (const e of filtered) {
			if (e.amount > mostExpensiveEntry.amount) mostExpensiveEntry = e
		}

		const [ey, em, ed] = mostExpensiveEntry.date.slice(0, 10).split("-").map(Number)
		const mostExpensiveDateFormatted = format(new Date(ey, em - 1, ed), "MMM d, yyyy")

		// Top tag + weekend % share the same total loop
		const totals = new Map<string, number>()
		let grandTotal = 0
		let weekendTotal = 0

		for (const e of filtered) {
			totals.set(e.tag, (totals.get(e.tag) ?? 0) + e.amount)
			grandTotal += e.amount
			const [wy, wm, wd] = e.date.slice(0, 10).split("-").map(Number)
			const dow = new Date(wy, wm - 1, wd).getDay() // 0=Sun, 6=Sat

			if (dow === 0 || dow === 6) weekendTotal += e.amount
		}

		let topTag = ""
		let topTagTotal = 0

		for (const [tag, total] of totals) {
			if (total > topTagTotal) {
				topTagTotal = total
				topTag = tag
			}
		}

		const topTagPct = grandTotal > 0 ? Math.round((topTagTotal / grandTotal) * 100) : 0
		const weekendPct = grandTotal > 0 ? Math.round((weekendTotal / grandTotal) * 100) : 0

		return {
			streak: maxStreak,
			mostExpensiveAmount: mostExpensiveEntry.amount,
			mostExpensiveTag: mostExpensiveEntry.tag,
			mostExpensiveDateFormatted,
			topTag,
			topTagTotal,
			topTagPct,
			weekendPct,
		}
	}, [filtered])
}

/** Renders 4 cards as fragments — wrap in a shared grid in the parent. */
export function ExtraStatCards({ stats, isLoading }: { stats: ExtraStats; isLoading?: boolean }) {
	return (
		<>
			<Card size="sm">
				<CardHeader>
					<CardDescription>Streak</CardDescription>
					<CardTitle>
						{isLoading ? (
							<Skeleton className="mt-1 h-7 w-28" />
						) : (
							<h3 className="text-2xl font-semibold tabular-nums">{stats.streak} days</h3>
						)}
					</CardTitle>
					<CardDescription>spend streak</CardDescription>
				</CardHeader>
			</Card>
			<Card size="sm">
				<CardHeader>
					<CardDescription>Biggest Entry</CardDescription>
					<CardTitle>
						{isLoading ? (
							<Skeleton className="mt-1 h-7 w-28" />
						) : (
							<h3 className="text-2xl font-semibold tabular-nums">
								{formatIDR(stats.mostExpensiveAmount)}
							</h3>
						)}
					</CardTitle>
					{isLoading ? (
						<Skeleton className="mt-1 h-4 w-32" />
					) : (
						<CardDescription>
							{capitalize(stats.mostExpensiveTag)} · {stats.mostExpensiveDateFormatted}
						</CardDescription>
					)}
				</CardHeader>
			</Card>
			<Card size="sm">
				<CardHeader>
					<CardDescription>Top Tag</CardDescription>
					<CardTitle>
						{isLoading ? (
							<Skeleton className="mt-1 h-7 w-28" />
						) : (
							<h3 className="text-2xl font-semibold tabular-nums">{capitalize(stats.topTag)}</h3>
						)}
					</CardTitle>
					{isLoading ? (
						<Skeleton className="mt-1 h-4 w-24" />
					) : (
						<CardDescription>
							{formatIDR(stats.topTagTotal)} · {stats.topTagPct}%
						</CardDescription>
					)}
				</CardHeader>
			</Card>
			<Card size="sm">
				<CardHeader>
					<CardDescription>Weekend Spend</CardDescription>
					<CardTitle>
						{isLoading ? (
							<Skeleton className="mt-1 h-6 w-16" />
						) : (
							<h3 className="text-2xl font-semibold tabular-nums">{stats.weekendPct}%</h3>
						)}
					</CardTitle>
					<CardDescription>of total spend</CardDescription>
				</CardHeader>
			</Card>
		</>
	)
}

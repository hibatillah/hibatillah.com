import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@packages/ui/components/skeleton"
import { formatIDR } from "@/lib/utils"

type Summary = {
	total: number
	dailyAverage: number
	biggestAmount: number
	entryCount: number
	activeDays: number
}

/** Renders 4 cards as fragments — wrap in a shared grid in the parent. */
export function StatCards({
	summary,
	biggestDateFormatted,
	isLoading,
}: {
	summary: Summary
	biggestDateFormatted: string
	isLoading?: boolean
}) {
	return (
		<>
			<Card size="sm">
				<CardHeader>
					<CardDescription>Total Spent</CardDescription>
					<CardTitle>
						{isLoading ? (
							<Skeleton className="mt-1 h-7 w-28" />
						) : (
							<h3 className="text-2xl font-semibold tabular-nums">{formatIDR(summary.total)}</h3>
						)}
					</CardTitle>
					{isLoading ? (
						<Skeleton className="mt-1 h-4 w-20" />
					) : (
						<CardDescription>{summary.activeDays} active days</CardDescription>
					)}
				</CardHeader>
			</Card>

			<Card size="sm">
				<CardHeader>
					<CardDescription>Daily Average</CardDescription>
					<CardTitle>
						{isLoading ? (
							<Skeleton className="mt-1 h-7 w-28" />
						) : (
							<h3 className="text-2xl font-semibold tabular-nums">
								{formatIDR(summary.dailyAverage)}
							</h3>
						)}
					</CardTitle>
					{isLoading ? (
						<Skeleton className="mt-1 h-4 w-20" />
					) : (
						<CardDescription>{summary.activeDays} active days</CardDescription>
					)}
				</CardHeader>
			</Card>

			<Card size="sm">
				<CardHeader>
					<CardDescription>Biggest Day</CardDescription>
					<CardTitle>
						{isLoading ? (
							<Skeleton className="mt-1 h-7 w-28" />
						) : (
							<h3 className="text-2xl font-semibold tabular-nums">
								{formatIDR(summary.biggestAmount)}
							</h3>
						)}
					</CardTitle>
					{isLoading ? (
						<Skeleton className="mt-1 h-4 w-20" />
					) : (
						<CardDescription>{biggestDateFormatted}</CardDescription>
					)}
				</CardHeader>
			</Card>

			<Card size="sm">
				<CardHeader>
					<CardDescription>Total Items</CardDescription>
					<CardTitle>
						{isLoading ? (
							<Skeleton className="mt-1 h-7 w-28" />
						) : (
							<h3 className="text-2xl font-semibold tabular-nums">{summary.entryCount}</h3>
						)}
					</CardTitle>
					<CardDescription>Entries</CardDescription>
				</CardHeader>
			</Card>
		</>
	)
}

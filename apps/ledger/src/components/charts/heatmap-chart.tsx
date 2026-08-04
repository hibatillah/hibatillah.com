import { endOfMonth } from "date-fns"
import { useCallback, useMemo, useRef, useState } from "react"
import type { DateRange } from "react-day-picker"

import { formatIDR } from "@/lib/utils"

type ExpenseRow = { date: string; amount: number; tag: string }

export type HeatmapDataPoint = { date: string; count: number }

export function useHeatmapData(
	filtered: ExpenseRow[],
	dateRange: DateRange,
	pickerYear: number,
	isYearMode: boolean,
): { data: HeatmapDataPoint[]; start: Date; end: Date } {
	return useMemo(() => {
		const dailyTotals = new Map<string, number>()

		for (const e of filtered) {
			const day = e.date.slice(0, 10)
			dailyTotals.set(day, (dailyTotals.get(day) ?? 0) + e.amount)
		}

		const data = Array.from(dailyTotals.entries()).map(([date, count]) => ({
			date,
			count,
		}))

		let start: Date
		let end: Date

		if (isYearMode) {
			start = new Date(pickerYear, 0, 1)
			end = new Date(pickerYear, 11, 31)
		} else {
			start = dateRange.from ?? new Date(pickerYear, 0, 1)
			end = dateRange.to ?? endOfMonth(start)
		}

		return { data, start, end }
	}, [filtered, dateRange, pickerYear, isYearMode])
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const DOW_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const MONTH_SHORT = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
]

const HEAT_COLORS = [
	"var(--color-muted)",
	"oklch(0.75 0.10 185)",
	"oklch(0.65 0.14 185)",
	"oklch(0.55 0.17 185)",
	"oklch(0.45 0.20 185)",
]

function toYmd(d: Date) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function getMonday(d: Date): Date {
	const day = d.getDay()
	const delta = day === 0 ? -6 : 1 - day
	return new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta)
}

function buildWeeks(start: Date, end: Date): Date[][] {
	const weeks: Date[][] = []
	let cur = getMonday(start)

	while (cur <= end) {
		const week: Date[] = []
		for (let i = 0; i < 7; i++)
			week.push(new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + i))
		weeks.push(week)
		cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 7)
	}

	return weeks
}

function colorLevel(count: number, max: number) {
	if (count <= 0 || max <= 0) return 0
	return Math.min(4, Math.ceil((count / max) * 4))
}

// ─── component ───────────────────────────────────────────────────────────────

export function HeatmapChart({
	data,
	start,
	end,
	isYearMode,
}: {
	data: HeatmapDataPoint[]
	start: Date
	end: Date
	isYearMode: boolean
}) {
	const ref = useRef<HTMLDivElement>(null)
	const [tooltip, setTooltip] = useState<{
		x: number
		y: number
		date: string
		count: number
	} | null>(null)

	const cellMap = useMemo(() => new Map(data.map((d) => [d.date, d.count])), [data])
	const max = useMemo(() => Math.max(...data.map((d) => d.count), 1), [data])
	const weeks = useMemo(() => buildWeeks(start, end), [start, end])

	// Month labels for year view: one per month change, left% relative to total weeks
	const monthLabels = useMemo(() => {
		if (!isYearMode) return []

		const labels: { pct: number; name: string }[] = []
		let prev = -1

		weeks.forEach((week, wi) => {
			// Use the first day in this week that falls within the range (skips Dec padding)
			const firstInRange = week.find((d) => d >= start)
			if (!firstInRange) return

			const m = firstInRange.getMonth()
			if (m !== prev) {
				labels.push({ pct: (wi / weeks.length) * 100, name: MONTH_SHORT[m] })
				prev = m
			}
		})
		return labels
	}, [weeks, isYearMode, start])

	const handleEnter = useCallback(
		(day: Date, e: React.MouseEvent) => {
			if (day < start || day > end || !ref.current) return
			const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
			const parent = ref.current.getBoundingClientRect()
			const ymd = toYmd(day)
			const count = cellMap.get(ymd) ?? 0

			setTooltip({
				x: rect.left - parent.left + rect.width / 2,
				y: rect.top - parent.top - 6,
				date: day.toLocaleDateString("en-US", {
					month: "short",
					day: "numeric",
					year: "numeric",
				}),
				count,
			})
		},
		[start, end, cellMap],
	)

	const renderCell = useCallback(
		(day: Date, key: string, extraStyle?: React.CSSProperties) => {
			const inRange = day >= start && day <= end
			const count = inRange ? (cellMap.get(toYmd(day)) ?? 0) : 0
			const level = inRange ? colorLevel(count, max) : -1

			return (
				<div
					key={key}
					className="cursor-default rounded-[3px]"
					style={{
						aspectRatio: "1 / 1",
						backgroundColor: level === -1 ? "transparent" : HEAT_COLORS[level],
						...extraStyle,
					}}
					onMouseEnter={(e) => inRange && handleEnter(day, e)}
				/>
			)
		},
		[start, end, cellMap, max, handleEnter],
	)

	return (
		<div ref={ref} className="relative w-full" onMouseLeave={() => setTooltip(null)}>
			{isYearMode ? (
				<>
					{/* Desktop: horizontal strip — weeks as columns, days as rows */}
					<div className="hidden sm:block">
						<div className="relative mb-1 h-4">
							{monthLabels.map(({ pct, name }) => (
								<span
									key={name}
									className="absolute text-[10px] text-muted-foreground"
									style={{ left: `${pct}%` }}
								>
									{name}
								</span>
							))}
						</div>
						<div
							style={{
								display: "grid",
								gridTemplateRows: "repeat(7, auto)",
								gridAutoFlow: "column",
								gridAutoColumns: "1fr",
								gap: 3,
							}}
						>
							{weeks.flatMap((week, wi) => week.map((day, di) => renderCell(day, `${wi}-${di}`)))}
						</div>
					</div>

					{/* Mobile: vertical — 7 columns (Mon–Sun), weeks as rows */}
					<div className="sm:hidden">
						<div className="mb-1 grid grid-cols-7 gap-1">
							{DOW_SHORT.map((d) => (
								<div key={d} className="text-center text-[10px] text-muted-foreground">
									{d[0]}
								</div>
							))}
						</div>
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "repeat(7, 1fr)",
								gap: 3,
							}}
						>
							{weeks.flatMap((week, wi) =>
								week.map((day, di) => renderCell(day, `m-${wi}-${di}`, { width: "100%" })),
							)}
						</div>
					</div>
				</>
			) : (
				<>
					{/* Day-of-week headers */}
					<div className="mb-1 grid grid-cols-7 gap-1">
						{DOW_SHORT.map((d) => (
							<div key={d} className="text-center text-[10px] text-muted-foreground">
								{d[0]}
							</div>
						))}
					</div>

					{/* Month grid: days as columns (Mon→Sun), weeks as rows */}
					<div className="grid grid-cols-7 gap-1">
						{weeks.flatMap((week, wi) =>
							week.map((day, di) => renderCell(day, `${wi}-${di}`, { width: "100%" })),
						)}
					</div>
				</>
			)}

			{tooltip && (
				<div
					className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl bg-popover px-3 py-2 text-xs whitespace-nowrap shadow-lg ring-1 ring-foreground/5"
					style={{ left: tooltip.x, top: tooltip.y }}
				>
					<span className="block font-medium text-foreground">{tooltip.date}</span>
					<div className="flex items-center gap-2 text-muted-foreground">
						<span>Total</span>
						<span className="ml-auto pl-4 font-mono font-medium text-foreground">
							{tooltip.count > 0 ? formatIDR(tooltip.count) : "No spend"}
						</span>
					</div>
				</div>
			)}
		</div>
	)
}

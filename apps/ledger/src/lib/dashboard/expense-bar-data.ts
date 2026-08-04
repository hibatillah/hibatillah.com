import { eachDayOfInterval, format, startOfDay } from "date-fns"
import { id } from "date-fns/locale"
import type { DateRange } from "react-day-picker"

import type { BarDataPoint } from "@/components/charts/expense-chart"

import { expenseYmdKey, getRangeBarStrategy } from "./date-filter"

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
] as const

const MONTH_FULL = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
] as const

type ExpenseRow = { date: string; amount: number; tag: string }

function emptyTagRecord(tags: string[]): Record<string, number> {
	return Object.fromEntries(tags.map((t) => [t, 0]))
}

export function buildExpenseBarData(
	filtered: ExpenseRow[],
	dateRange: DateRange,
	tags: string[],
	year: number,
): BarDataPoint[] {
	const strategy = getRangeBarStrategy(dateRange)

	if (strategy === "daily" && dateRange.from) {
		const from = startOfDay(dateRange.from)
		const to = startOfDay(dateRange.to ?? dateRange.from)
		const days = eachDayOfInterval({ start: from, end: to })
		const dayMap = new Map<string, BarDataPoint>()
		for (const d of days) {
			const key = format(d, "yyyy-MM-dd")
			dayMap.set(key, {
				label: format(d, "PPP", { locale: id }),
				tick: format(d, "d"),
				...emptyTagRecord(tags),
			})
		}
		for (const e of filtered) {
			const entry = dayMap.get(expenseYmdKey(e.date))
			if (entry) entry[e.tag] = ((entry[e.tag] as number) ?? 0) + e.amount
		}
		return Array.from(dayMap.values())
	}

	if (strategy === "monthBuckets" && dateRange.from) {
		const from = startOfDay(dateRange.from)
		const to = startOfDay(dateRange.to ?? dateRange.from)
		const monthMap = new Map<string, BarDataPoint>()
		let cur = new Date(from.getFullYear(), from.getMonth(), 1)
		const end = new Date(to.getFullYear(), to.getMonth(), 1)
		while (cur <= end) {
			const key = format(cur, "yyyy-MM")
			const tick = format(cur, "MMM")
			monthMap.set(key, {
				label: format(cur, "MMMM yyyy"),
				tick,
				...emptyTagRecord(tags),
			})
			cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
		}
		for (const e of filtered) {
			const key = e.date.slice(0, 7)
			const entry = monthMap.get(key)
			if (entry) entry[e.tag] = ((entry[e.tag] as number) ?? 0) + e.amount
		}
		return Array.from(monthMap.values())
	}

	const monthMap = new Map<number, Record<string, number>>()
	for (let m = 1; m <= 12; m++) {
		monthMap.set(m, emptyTagRecord(tags))
	}
	for (const e of filtered) {
		const m = parseInt(e.date.split("-")[1], 10)
		const entry = monthMap.get(m)
		if (entry) entry[e.tag] = ((entry[e.tag] as number) ?? 0) + e.amount
	}
	return Array.from(monthMap.entries()).map(([m, tagData]) => ({
		label: `${MONTH_FULL[m - 1]} ${year}`,
		tick: MONTH_SHORT[m - 1],
		...tagData,
	}))
}

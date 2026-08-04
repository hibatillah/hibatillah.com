import { differenceInDays, endOfDay, endOfMonth, format, startOfDay, startOfMonth } from "date-fns"
import type { DateRange } from "react-day-picker"

function daysInMonth(year: number, month: number) {
	return new Date(year, month, 0).getDate()
}

/** Range covers exactly one calendar month (first through last day). */
export function getFullMonthIfCovers(from: Date, to: Date): { year: number; month: number } | null {
	const s = startOfDay(from)
	const e = startOfDay(to)
	const y = s.getFullYear()
	const m = s.getMonth() + 1

	if (s.getDate() !== 1) return null
	if (e.getFullYear() !== y || e.getMonth() + 1 !== m) return null
	if (e.getDate() !== daysInMonth(y, m)) return null

	return { year: y, month: m }
}

export const DAILY_BAR_MAX_SPAN_DAYS = 30

export function getRangeBarStrategy(dateRange: DateRange): "year" | "daily" | "monthBuckets" {
	if (!dateRange.from) return "year"
	const from = dateRange.from
	const to = dateRange.to ?? dateRange.from
	const s = startOfDay(from)
	const e = startOfDay(to)
	const spanDays = differenceInDays(e, s) + 1

	if (getFullMonthIfCovers(from, to) || spanDays <= DAILY_BAR_MAX_SPAN_DAYS) {
		return "daily"
	}

	return "monthBuckets"
}

/** Stored dates may be `yyyy-MM-dd` or `yyyy-MM-dd'T'HH:mm:ss` from CSV import. */
export function expenseYmdKey(s: string): string {
	return s.slice(0, 10)
}

/** Parse calendar day from expense date string (local midnight; avoids parseISO UTC shift). */
export function localDateFromExpense(s: string): Date {
	const ymd = expenseYmdKey(s)
	const [y, m, d] = ymd.split("-").map(Number)

	return new Date(y, m - 1, d)
}

export type DateFilterState = {
	dateRange: DateRange
	pickerYear: number
}

export function defaultDateFilterState(): DateFilterState {
	const now = new Date()
	const y = now.getFullYear()
	const m = now.getMonth() + 1
	const anchor = new Date(y, m - 1, 1)

	return {
		pickerYear: y,
		dateRange: { from: startOfMonth(anchor), to: endOfMonth(anchor) },
	}
}

/** True when `state` matches a fresh `defaultDateFilterState()` (same calendar range + year). */
export function isDefaultDateFilterState(state: DateFilterState): boolean {
	const baseline = defaultDateFilterState()
	if (state.pickerYear !== baseline.pickerYear) return false

	const s = state.dateRange
	const b = baseline.dateRange

	if (!b.from) return false
	if (!s.from) return false

	const sFrom = startOfDay(s.from).getTime()
	const bFrom = startOfDay(b.from).getTime()
	const sTo = startOfDay(s.to ?? s.from).getTime()
	const bTo = startOfDay(b.to ?? b.from).getTime()

	return sFrom === bFrom && sTo === bTo
}

export function formatDateFilterButtonLabel(dateRange: DateRange, pickerYear: number): string {
	if (!dateRange.from) return String(pickerYear)

	const from = dateRange.from
	const to = dateRange.to ?? dateRange.from

	if (getFullMonthIfCovers(from, to)) {
		return format(from, "MMMM yyyy")
	}

	if (to.getTime() === from.getTime()) {
		return format(from, "MMM d, yyyy")
	}

	return `${format(from, "MMM dd")} - ${format(to, "MMM dd, yyyy")}`
}

export function filterExpensesByDateFilter<T extends { date: string }>(
	allExpenses: T[],
	dateRange: DateRange,
	pickerYear: number,
): T[] {
	return allExpenses.filter((e) => {
		if (dateRange.from) {
			const d = localDateFromExpense(e.date)
			const from = startOfDay(dateRange.from)
			const to = endOfDay(dateRange.to ?? dateRange.from)
			return d >= from && d <= to
		}
		const y = parseInt(e.date.slice(0, 4), 10)
		return y === pickerYear
	})
}

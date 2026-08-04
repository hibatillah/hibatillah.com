import { endOfMonth, startOfMonth } from "date-fns"
import { FunnelIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import type { DateRange } from "react-day-picker"

import { Button } from "@packages/ui/components/button"
import { Calendar } from "@packages/ui/components/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@packages/ui/components/popover"
import { Separator } from "@packages/ui/components/separator"
import { ToggleGroup, ToggleGroupItem } from "@packages/ui/components/toggle-group"
import { useIsMobile } from "@/hooks/use-mobile"
import {
	type DateFilterState,
	formatDateFilterButtonLabel,
	getFullMonthIfCovers,
} from "@/lib/dashboard/date-filter"
import { cn } from "@/lib/utils"

const MONTH_TOGGLE_ITEMS = [
	{ value: "1", label: "Jan" },
	{ value: "2", label: "Feb" },
	{ value: "3", label: "Mar" },
	{ value: "4", label: "Apr" },
	{ value: "5", label: "May" },
	{ value: "6", label: "Jun" },
	{ value: "7", label: "Jul" },
	{ value: "8", label: "Aug" },
	{ value: "9", label: "Sep" },
	{ value: "10", label: "Oct" },
	{ value: "11", label: "Nov" },
	{ value: "12", label: "Dec" },
] as const

interface DateFilterPopoverProps {
	allExpenses: { date: string }[]
	value: DateFilterState
	onChange: (next: DateFilterState) => void
	className?: string
}

export function DateFilterPopover({
	allExpenses,
	value,
	onChange,
	className,
}: DateFilterPopoverProps) {
	const isMobile = useIsMobile()
	const { dateRange, pickerYear } = value

	const [pickerMonth, setPickerMonth] = useState<number | null>(() => new Date().getMonth() + 1)

	useEffect(() => {
		const dr = value.dateRange
		if (!dr.from) {
			setPickerMonth(null)
			return
		}
		const fm = getFullMonthIfCovers(dr.from, dr.to ?? dr.from)
		setPickerMonth(fm ? fm.month : null)
	}, [value])

	const calendarDefaultMonth = dateRange.from ?? new Date(pickerYear, (pickerMonth ?? 1) - 1, 1)

	const yearOptions = useMemo(() => {
		const current = new Date().getFullYear()
		const fromData = allExpenses.map((e) => parseInt(e.date.slice(0, 4), 10))
		return [...new Set([current, pickerYear, ...fromData])].sort((a, b) => b - a)
	}, [allExpenses, pickerYear])

	const dateButtonLabel = useMemo(
		() => formatDateFilterButtonLabel(dateRange, pickerYear),
		[dateRange, pickerYear],
	)

	const triggerMinWidth = useMemo(() => {
		if (!dateRange.from) return "min-w-24"
		if (getFullMonthIfCovers(dateRange.from, dateRange.to ?? dateRange.from)) return "min-w-40"
		return "min-w-52"
	}, [dateRange])

	function applyMonthInYear(y: number, m: number) {
		const anchor = new Date(y, m - 1, 1)
		onChange({
			pickerYear: y,
			dateRange: { from: startOfMonth(anchor), to: endOfMonth(anchor) },
		})
	}

	function handleYearToggle(values: string[]) {
		if (values.length === 0) return
		const y = parseInt(values[0], 10)

		if (pickerMonth != null) {
			applyMonthInYear(y, pickerMonth)
		} else {
			onChange({ pickerYear: y, dateRange: { from: undefined, to: undefined } })
		}
	}

	function handleMonthToggle(values: string[]) {
		if (values.length === 0) {
			setPickerMonth(null)
			onChange({
				pickerYear,
				dateRange: { from: undefined, to: undefined },
			})
			return
		}

		const m = parseInt(values[0], 10)
		setPickerMonth(m)
		applyMonthInYear(pickerYear, m)
	}

	function handleCalendarSelect(range: DateRange | undefined) {
		const next = range ?? { from: undefined, to: undefined }

		if (!next.from) {
			setPickerMonth(null)
			onChange({ pickerYear, dateRange: next })
			return
		}

		const from = next.from
		const fm = getFullMonthIfCovers(from, next.to ?? next.from)

		setPickerMonth(fm ? fm.month : null)
		onChange({
			pickerYear: from.getFullYear(),
			dateRange: next,
		})
	}

	return (
		<Popover>
			<PopoverTrigger
				render={
					<Button
						variant="secondary"
						className={cn("justify-start px-3", triggerMinWidth, className)}
					>
						<FunnelIcon />
						<span className="mx-auto">{dateButtonLabel}</span>
					</Button>
				}
			/>
			<PopoverContent
				align="start"
				className="flex w-fit! flex-col flex-nowrap items-stretch gap-2 overflow-hidden bg-popover/70 backdrop-blur-2xl backdrop-saturate-150 md:flex-row"
			>
				<Calendar
					mode="range"
					selected={dateRange}
					onSelect={handleCalendarSelect}
					defaultMonth={calendarDefaultMonth}
					numberOfMonths={isMobile ? 1 : 2}
					captionLayout="dropdown-years"
				/>
				<Separator
					orientation={isMobile ? "horizontal" : "vertical"}
					className="my-auto md:h-74!"
				/>
				<div className="grid w-52 grid-cols-2 gap-2">
					<ToggleGroup
						variant="outline"
						orientation="vertical"
						spacing={1}
						className="no-scrollbar h-40 w-full overflow-y-auto overscroll-contain md:h-74"
						value={pickerMonth != null ? [String(pickerMonth)] : ([] as string[])}
						onValueChange={handleMonthToggle}
					>
						{MONTH_TOGGLE_ITEMS.map(({ value: v, label }) => (
							<ToggleGroupItem key={v} value={v}>
								{label}
							</ToggleGroupItem>
						))}
					</ToggleGroup>
					<ToggleGroup
						variant="outline"
						orientation="vertical"
						spacing={1}
						value={[String(pickerYear)]}
						onValueChange={handleYearToggle}
						className="no-scrollbar h-40 w-full overflow-y-auto overscroll-contain md:h-74"
					>
						{yearOptions.map((y) => (
							<ToggleGroupItem key={y} value={String(y)}>
								{y}
							</ToggleGroupItem>
						))}
					</ToggleGroup>
				</div>
			</PopoverContent>
		</Popover>
	)
}
